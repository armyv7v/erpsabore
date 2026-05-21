-- =============================================================================
-- SECURITY FIXES — ERP Sabore
-- 2026-05-20
--
-- Fixes incluidos:
--   S1. Privilege escalation: profiles_update_same_tenant permite que cualquier
--       usuario del mismo tenant modifique el campo "role" de otro usuario.
--       Fix: solo admins pueden cambiar roles; usuarios solo pueden editar su
--       propio perfil (sin tocar role).
--
--   S2. tenants_insert_initial permite que usuarios ya miembros de un tenant
--       creen nuevos tenants ilimitadamente.
--       Fix: la creación de tenant solo es válida si el usuario no tiene perfil
--       activo en ningún tenant existente.
--
--   S3. issue_invoice_secure y register_invoice_payment_secure no verifican el
--       rol del usuario, solo el tenant. Un usuario "bodega" puede emitir
--       facturas o registrar pagos.
--       Fix: ambas funciones requieren rol admin, ventas o finanzas.
--
--   S4. register_invoice_payment_secure lee el saldo de accounts_receivable sin
--       FOR UPDATE. Dos pagos concurrentes sobre la misma factura pueden pasar
--       la validación de saldo simultáneamente (race condition).
--       Fix: SELECT ... FOR UPDATE en el bloqueo del receivable.
--
--   S5. Índice faltante en customers(tenant_id, rut) filtrado por deleted_at.
--       Cada búsqueda de cliente por RUT hace full-scan. Crítico en RPCs de
--       creación de factura.
-- =============================================================================


-- =============================================================================
-- S1. FIX: profiles_update_same_tenant — privilege escalation
-- =============================================================================
-- Eliminamos la política actual (definida en _rls.sql) y la reemplazamos con
-- dos políticas separadas con responsabilidades distintas.

drop policy if exists "profiles_update_same_tenant" on public.profiles;

-- Política 1: Un usuario puede actualizar su PROPIO perfil pero NO puede
-- cambiar su propio rol (solo el admin puede hacer eso).
create policy "profiles_update_own_except_role"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  -- Cualquier campo excepto role puede ser modificado por el propio usuario.
  -- El rol solo puede ser cambiado por un admin (política separada abajo).
  -- La restricción se hace verificando que el nuevo role sea igual al actual.
  and role = (select role from public.profiles where id = auth.uid())
);

-- Política 2: Un admin puede actualizar cualquier perfil de su mismo tenant,
-- incluyendo el campo role.
create policy "profiles_update_admin_any"
on public.profiles
for update
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = public.current_tenant_id()
      and p.role = 'admin'
  )
)
with check (
  tenant_id = public.current_tenant_id()
);


-- =============================================================================
-- S2. FIX: tenants_insert_initial — multi-tenant abuse
-- =============================================================================
-- Cualquier usuario autenticado puede crear tenants ilimitadamente.
-- Fix: solo se permite si el usuario NO tiene perfil en ningún tenant previo.

drop policy if exists "tenants_insert_initial" on public.tenants;

create policy "tenants_insert_initial"
on public.tenants
for insert
to authenticated
with check (
  auth.uid() is not null
  -- El usuario no debe tener ningún perfil activo en otro tenant
  and not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
  )
);


-- =============================================================================
-- S3 + S4. FIX: RPCs sin verificación de rol + race condition
-- =============================================================================

-- issue_invoice_secure: agrega verificación de rol
create or replace function public.issue_invoice_secure(target_invoice_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid;
  current_profile public.profiles%rowtype;
  target_invoice public.invoices%rowtype;
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

  -- S3 FIX: verificar que el usuario tiene rol autorizado para emitir facturas
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

  update public.invoices
  set status = 'issued',
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
  set balance = excluded.balance,
      status = excluded.status,
      due_date = excluded.due_date,
      updated_at = now();

  return target_invoice.id;
end;
$$;

grant execute on function public.issue_invoice_secure(uuid) to authenticated;


-- register_invoice_payment_secure: agrega verificación de rol + FOR UPDATE
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

  -- S3 FIX: verificar rol antes de procesar el pago
  if current_profile.role not in ('admin', 'finanzas') then
    raise exception 'Insufficient permissions to register payments. Required role: admin or finanzas.'
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

  -- S4 FIX: FOR UPDATE evita que dos transacciones concurrentes lean el mismo
  -- saldo y ambas pasen la validación. La segunda transacción bloqueará aquí
  -- hasta que la primera haga COMMIT, leyendo el saldo actualizado.
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


-- =============================================================================
-- S5. FIX: índice faltante en customers(tenant_id, rut)
-- =============================================================================
-- create_draft_invoice_with_customer busca por (tenant_id, rut, deleted_at)
-- en cada creación de factura. Sin índice → full scan.

create index if not exists idx_customers_rut
  on public.customers (tenant_id, rut)
  where deleted_at is null;


-- Recargar schema de PostgREST
notify pgrst, 'reload schema';
