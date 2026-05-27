-- =============================================================================
-- DATABASE FIX: Permitir al rol 'ventas' (vendedores / cajeros) registrar pagos
-- Afecta al flujo de cobro del POS.
-- =============================================================================

create or replace function public.register_invoice_payment_secure(
  target_invoice_id uuid,
  payment_amount numeric,
  payment_date_value date,
  payment_reference text default null,
  payment_method_value text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid;
  current_profile public.profiles%rowtype;
  target_invoice public.invoices%rowtype;
  target_receivable public.accounts_receivable%rowtype;
  next_balance numeric(14,2);
  next_receivable_status public.receivable_status;
  next_invoice_status public.invoice_status;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'No authenticated user found.';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = current_user_id;

  if not found then
    raise exception 'No profile found for current user.';
  end if;

  -- PERMISSION FIX: El rol 'ventas' (vendedores y cajeros) debe poder registrar pagos de sus ventas
  if current_profile.role not in ('admin', 'finanzas', 'ventas') then
    raise exception 'Insufficient permissions to register payments. Required role: admin, finanzas or ventas.'
      using errcode = 'insufficient_privilege';
  end if;

  select *
  into target_invoice
  from public.invoices
  where id = target_invoice_id
    and tenant_id = current_profile.tenant_id;

  if not found then
    raise exception 'Invoice not found.';
  end if;

  -- Bloquear registro para actualización concurrente
  select *
  into target_receivable
  from public.accounts_receivable
  where invoice_id = target_invoice_id
    and tenant_id = current_profile.tenant_id
  for update;

  if not found then
    raise exception 'Invoice receivable not found.';
  end if;

  if payment_amount <= 0 then
    raise exception 'Payment amount must be positive.';
  end if;

  if payment_amount > target_receivable.balance then
    raise exception 'Payment cannot exceed outstanding balance.';
  end if;

  insert into public.cash_movements (
    tenant_id,
    source_type,
    source_id,
    kind,
    amount,
    movement_date,
    reference,
    payment_method,
    status,
    created_by
  )
  values (
    current_profile.tenant_id,
    'invoice',
    target_invoice_id,
    'income',
    payment_amount,
    payment_date_value,
    coalesce(nullif(trim(coalesce(payment_reference, '')), ''), 'Pago factura ' || target_invoice.number),
    coalesce(nullif(trim(coalesce(payment_method_value, '')), ''), 'transferencia'),
    'confirmed',
    current_user_id
  );

  next_balance := round(target_receivable.balance - payment_amount, 2);
  next_receivable_status := case when next_balance = 0 then 'settled' else 'partial' end;
  next_invoice_status := case when next_balance = 0 then 'paid' else 'partially_paid' end;

  update public.accounts_receivable
  set balance = next_balance,
      status = next_receivable_status,
      last_payment_at = now(),
      updated_at = now()
  where id = target_receivable.id;

  update public.invoices
  set status = next_invoice_status,
      updated_at = now()
  where id = target_invoice.id;

  return target_invoice.id;
end;
$$;

grant execute on function public.register_invoice_payment_secure(uuid, numeric, date, text, text) to authenticated;

notify pgrst, 'reload schema';
