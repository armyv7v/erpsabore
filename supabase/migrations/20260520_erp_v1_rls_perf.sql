-- =============================================================================
-- OPTIMIZACIÓN: current_tenant_id() — evitar N+1 en evaluación de RLS
-- 2026-05-20
--
-- Problema:
--   current_tenant_id() es llamada UNA VEZ POR FILA al evaluar policies RLS.
--   Con 1.000 facturas, una query SELECT hace 1.000 llamadas a la función, que
--   a su vez hace 1.000 SELECTs sobre public.profiles.
--   Resultado: O(n) queries encadenados por cada acceso a la tabla.
--
-- Causa raíz:
--   PostgreSQL solo "inlinea" funciones SQL si son IMMUTABLE o si el planner
--   puede demostrar que el resultado no cambia. STABLE + SECURITY DEFINER
--   impide el inlining automático porque el planner no puede ver dentro.
--
-- Fix:
--   Agregar PARALLEL SAFE a la función para que el planner sepa que puede
--   compartir el resultado entre workers paralelos.
--
--   Más importante: documentar que los callers DEBEN usar el patrón
--   (select public.current_tenant_id()) — con el SELECT envuelto — para forzar
--   que el planner evalúe la función UNA SOLA VEZ por statement en lugar de
--   por fila. Este patrón es la recomendación oficial de Supabase.
--
-- Referencia: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- =============================================================================

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
parallel safe
security definer
set search_path = public
as $$
  select tenant_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

-- =============================================================================
-- Actualizar las policies de la migración principal (_rls.sql) para usar el
-- patrón (select public.current_tenant_id()) que fuerza evaluación única
-- por statement en lugar de por fila.
--
-- Solo actualizamos las policies que hacen full-scan más frecuente:
-- invoices, invoice_items, accounts_receivable y cash_movements.
-- Las demás se optimizan también pero tienen menor volumen.
-- =============================================================================

-- invoices
drop policy if exists "invoices_read_same_tenant" on public.invoices;
create policy "invoices_read_same_tenant"
on public.invoices for select
to authenticated
using (tenant_id = (select public.current_tenant_id()));

drop policy if exists "invoices_insert_same_tenant" on public.invoices;
create policy "invoices_insert_same_tenant"
on public.invoices for insert
to authenticated
with check (tenant_id = (select public.current_tenant_id()));

drop policy if exists "invoices_update_same_tenant" on public.invoices;
create policy "invoices_update_same_tenant"
on public.invoices for update
to authenticated
using (tenant_id = (select public.current_tenant_id()))
with check (tenant_id = (select public.current_tenant_id()));

-- invoice_items
drop policy if exists "invoice_items_read_same_tenant" on public.invoice_items;
create policy "invoice_items_read_same_tenant"
on public.invoice_items for select
to authenticated
using (tenant_id = (select public.current_tenant_id()));

drop policy if exists "invoice_items_insert_same_tenant" on public.invoice_items;
create policy "invoice_items_insert_same_tenant"
on public.invoice_items for insert
to authenticated
with check (tenant_id = (select public.current_tenant_id()));

drop policy if exists "invoice_items_update_same_tenant" on public.invoice_items;
create policy "invoice_items_update_same_tenant"
on public.invoice_items for update
to authenticated
using (tenant_id = (select public.current_tenant_id()))
with check (tenant_id = (select public.current_tenant_id()));

-- accounts_receivable
drop policy if exists "receivables_read_same_tenant" on public.accounts_receivable;
create policy "receivables_read_same_tenant"
on public.accounts_receivable for select
to authenticated
using (tenant_id = (select public.current_tenant_id()));

drop policy if exists "receivables_insert_same_tenant" on public.accounts_receivable;
create policy "receivables_insert_same_tenant"
on public.accounts_receivable for insert
to authenticated
with check (tenant_id = (select public.current_tenant_id()));

drop policy if exists "receivables_update_same_tenant" on public.accounts_receivable;
create policy "receivables_update_same_tenant"
on public.accounts_receivable for update
to authenticated
using (tenant_id = (select public.current_tenant_id()))
with check (tenant_id = (select public.current_tenant_id()));

-- cash_movements
drop policy if exists "cash_movements_read_same_tenant" on public.cash_movements;
create policy "cash_movements_read_same_tenant"
on public.cash_movements for select
to authenticated
using (tenant_id = (select public.current_tenant_id()));

drop policy if exists "cash_movements_insert_same_tenant" on public.cash_movements;
create policy "cash_movements_insert_same_tenant"
on public.cash_movements for insert
to authenticated
with check (tenant_id = (select public.current_tenant_id()));

-- customers
drop policy if exists "customers_read_same_tenant" on public.customers;
create policy "customers_read_same_tenant"
on public.customers for select
to authenticated
using (tenant_id = (select public.current_tenant_id()));

drop policy if exists "customers_insert_same_tenant" on public.customers;
create policy "customers_insert_same_tenant"
on public.customers for insert
to authenticated
with check (tenant_id = (select public.current_tenant_id()));

drop policy if exists "customers_update_same_tenant" on public.customers;
create policy "customers_update_same_tenant"
on public.customers for update
to authenticated
using (tenant_id = (select public.current_tenant_id()))
with check (tenant_id = (select public.current_tenant_id()));

-- products (recién creadas en el migration de inventory)
drop policy if exists "products_read_same_tenant" on public.products;
create policy "products_read_same_tenant"
on public.products for select
to authenticated
using (
  tenant_id = (select public.current_tenant_id())
  and deleted_at is null
);

drop policy if exists "products_insert_same_tenant" on public.products;
create policy "products_insert_same_tenant"
on public.products for insert
to authenticated
with check (
  tenant_id = (select public.current_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = (select public.current_tenant_id())
      and p.role in ('admin', 'bodega')
  )
);

drop policy if exists "products_update_same_tenant" on public.products;
create policy "products_update_same_tenant"
on public.products for update
to authenticated
using (
  tenant_id = (select public.current_tenant_id())
  and deleted_at is null
)
with check (
  tenant_id = (select public.current_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = (select public.current_tenant_id())
      and p.role in ('admin', 'bodega')
  )
);

drop policy if exists "products_delete_same_tenant" on public.products;
create policy "products_delete_same_tenant"
on public.products for delete
to authenticated
using (
  tenant_id = (select public.current_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = (select public.current_tenant_id())
      and p.role = 'admin'
  )
);

notify pgrst, 'reload schema';
