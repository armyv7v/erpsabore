create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

grant execute on function public.current_tenant_id() to authenticated;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.suppliers enable row level security;
alter table public.employees enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.accounts_receivable enable row level security;
alter table public.cash_movements enable row level security;

drop policy if exists "tenants_select_for_authenticated" on public.tenants;
create policy "tenants_select_for_authenticated"
on public.tenants
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = tenants.id
  )
  or not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
  )
);

drop policy if exists "tenants_insert_initial" on public.tenants;
create policy "tenants_insert_initial"
on public.tenants
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or tenant_id = public.current_tenant_id()
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and exists (
    select 1
    from public.tenants t
    where t.id = tenant_id
  )
);

drop policy if exists "profiles_update_same_tenant" on public.profiles;
create policy "profiles_update_same_tenant"
on public.profiles
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "customers_read_same_tenant" on public.customers;
create policy "customers_read_same_tenant"
on public.customers
for select
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists "customers_insert_same_tenant" on public.customers;
create policy "customers_insert_same_tenant"
on public.customers
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists "customers_update_same_tenant" on public.customers;
create policy "customers_update_same_tenant"
on public.customers
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "products_read_same_tenant" on public.products;
create policy "products_read_same_tenant"
on public.products
for select
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists "products_insert_same_tenant" on public.products;
create policy "products_insert_same_tenant"
on public.products
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists "products_update_same_tenant" on public.products;
create policy "products_update_same_tenant"
on public.products
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "suppliers_read_same_tenant" on public.suppliers;
create policy "suppliers_read_same_tenant"
on public.suppliers
for select
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists "suppliers_insert_same_tenant" on public.suppliers;
create policy "suppliers_insert_same_tenant"
on public.suppliers
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists "suppliers_update_same_tenant" on public.suppliers;
create policy "suppliers_update_same_tenant"
on public.suppliers
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "employees_read_same_tenant" on public.employees;
create policy "employees_read_same_tenant"
on public.employees
for select
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists "employees_insert_same_tenant" on public.employees;
create policy "employees_insert_same_tenant"
on public.employees
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists "employees_update_same_tenant" on public.employees;
create policy "employees_update_same_tenant"
on public.employees
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "invoices_read_same_tenant" on public.invoices;
create policy "invoices_read_same_tenant"
on public.invoices
for select
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists "invoices_insert_same_tenant" on public.invoices;
create policy "invoices_insert_same_tenant"
on public.invoices
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists "invoices_update_same_tenant" on public.invoices;
create policy "invoices_update_same_tenant"
on public.invoices
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "invoice_items_read_same_tenant" on public.invoice_items;
create policy "invoice_items_read_same_tenant"
on public.invoice_items
for select
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists "invoice_items_insert_same_tenant" on public.invoice_items;
create policy "invoice_items_insert_same_tenant"
on public.invoice_items
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists "invoice_items_update_same_tenant" on public.invoice_items;
create policy "invoice_items_update_same_tenant"
on public.invoice_items
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "receivables_read_same_tenant" on public.accounts_receivable;
create policy "receivables_read_same_tenant"
on public.accounts_receivable
for select
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists "receivables_insert_same_tenant" on public.accounts_receivable;
create policy "receivables_insert_same_tenant"
on public.accounts_receivable
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists "receivables_update_same_tenant" on public.accounts_receivable;
create policy "receivables_update_same_tenant"
on public.accounts_receivable
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "cash_movements_read_same_tenant" on public.cash_movements;
create policy "cash_movements_read_same_tenant"
on public.cash_movements
for select
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists "cash_movements_insert_same_tenant" on public.cash_movements;
create policy "cash_movements_insert_same_tenant"
on public.cash_movements
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists "cash_movements_update_same_tenant" on public.cash_movements;
create policy "cash_movements_update_same_tenant"
on public.cash_movements
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());
