-- =============================================================================
-- Actualizar issue_invoice_secure para usar numeración correlativa SII
-- 2026-05-20
--
-- Antes: genera número aleatorio tipo FV-20260520-A3B4C5D6
-- Ahora: asigna número correlativo tipo FV-000001 via get_next_invoice_number()
--
-- El número correlativo queda en AMBOS campos para compatibilidad:
--   - invoices.number (el campo legacy, existente)
--   - invoices.seq_number (el nuevo campo con índice único)
-- =============================================================================

create or replace function public.issue_invoice_secure(target_invoice_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid;
  current_profile public.profiles%rowtype;
  target_invoice  public.invoices%rowtype;
  correlative_number text;
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

  -- Verificación de rol (fix S3 de security_fixes.sql, replicada aquí)
  if current_profile.role not in ('admin', 'ventas', 'finanzas') then
    raise exception 'Insufficient permissions to issue invoices. Required role: admin, ventas, or finanzas.'
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

  if target_invoice.status <> 'draft' then
    raise exception 'Only draft invoices can be issued.';
  end if;

  -- Obtener el siguiente número correlativo (atómico, FOR UPDATE interno)
  correlative_number := public.get_next_invoice_number(current_profile.tenant_id);

  update public.invoices
  set
    status     = 'issued',
    number     = correlative_number,
    seq_number = correlative_number,
    updated_at = now()
  where id = target_invoice.id;

  insert into public.accounts_receivable (
    tenant_id,
    invoice_id,
    balance,
    status,
    due_date
  )
  values (
    current_profile.tenant_id,
    target_invoice.id,
    target_invoice.total,
    'open',
    target_invoice.due_date
  )
  on conflict (invoice_id)
  do update
  set
    balance    = excluded.balance,
    status     = excluded.status,
    due_date   = excluded.due_date,
    updated_at = now();

  return target_invoice.id;
end;
$$;

grant execute on function public.issue_invoice_secure(uuid) to authenticated;

notify pgrst, 'reload schema';
