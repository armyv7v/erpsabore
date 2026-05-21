drop policy if exists "customers_read_same_tenant" on public.customers;
create policy "customers_read_same_tenant"
on public.customers
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = customers.tenant_id
  )
);

drop policy if exists "customers_insert_same_tenant" on public.customers;
create policy "customers_insert_same_tenant"
on public.customers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = customers.tenant_id
  )
);

drop policy if exists "customers_update_same_tenant" on public.customers;
create policy "customers_update_same_tenant"
on public.customers
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = customers.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = customers.tenant_id
  )
);

drop policy if exists "products_read_same_tenant" on public.products;
create policy "products_read_same_tenant"
on public.products
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = products.tenant_id
  )
);

drop policy if exists "products_insert_same_tenant" on public.products;
create policy "products_insert_same_tenant"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = products.tenant_id
  )
);

drop policy if exists "products_update_same_tenant" on public.products;
create policy "products_update_same_tenant"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = products.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = products.tenant_id
  )
);

drop policy if exists "suppliers_read_same_tenant" on public.suppliers;
create policy "suppliers_read_same_tenant"
on public.suppliers
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = suppliers.tenant_id
  )
);

drop policy if exists "suppliers_insert_same_tenant" on public.suppliers;
create policy "suppliers_insert_same_tenant"
on public.suppliers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = suppliers.tenant_id
  )
);

drop policy if exists "suppliers_update_same_tenant" on public.suppliers;
create policy "suppliers_update_same_tenant"
on public.suppliers
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = suppliers.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = suppliers.tenant_id
  )
);

drop policy if exists "employees_read_same_tenant" on public.employees;
create policy "employees_read_same_tenant"
on public.employees
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = employees.tenant_id
  )
);

drop policy if exists "employees_insert_same_tenant" on public.employees;
create policy "employees_insert_same_tenant"
on public.employees
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = employees.tenant_id
  )
);

drop policy if exists "employees_update_same_tenant" on public.employees;
create policy "employees_update_same_tenant"
on public.employees
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = employees.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = employees.tenant_id
  )
);

drop policy if exists "invoices_read_same_tenant" on public.invoices;
create policy "invoices_read_same_tenant"
on public.invoices
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = invoices.tenant_id
  )
);

drop policy if exists "invoices_insert_same_tenant" on public.invoices;
create policy "invoices_insert_same_tenant"
on public.invoices
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = invoices.tenant_id
  )
);

drop policy if exists "invoices_update_same_tenant" on public.invoices;
create policy "invoices_update_same_tenant"
on public.invoices
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = invoices.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = invoices.tenant_id
  )
);

drop policy if exists "invoice_items_read_same_tenant" on public.invoice_items;
create policy "invoice_items_read_same_tenant"
on public.invoice_items
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = invoice_items.tenant_id
  )
);

drop policy if exists "invoice_items_insert_same_tenant" on public.invoice_items;
create policy "invoice_items_insert_same_tenant"
on public.invoice_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = invoice_items.tenant_id
  )
);

drop policy if exists "invoice_items_update_same_tenant" on public.invoice_items;
create policy "invoice_items_update_same_tenant"
on public.invoice_items
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = invoice_items.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = invoice_items.tenant_id
  )
);

drop policy if exists "receivables_read_same_tenant" on public.accounts_receivable;
create policy "receivables_read_same_tenant"
on public.accounts_receivable
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = accounts_receivable.tenant_id
  )
);

drop policy if exists "receivables_insert_same_tenant" on public.accounts_receivable;
create policy "receivables_insert_same_tenant"
on public.accounts_receivable
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = accounts_receivable.tenant_id
  )
);

drop policy if exists "receivables_update_same_tenant" on public.accounts_receivable;
create policy "receivables_update_same_tenant"
on public.accounts_receivable
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = accounts_receivable.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = accounts_receivable.tenant_id
  )
);

drop policy if exists "cash_movements_read_same_tenant" on public.cash_movements;
create policy "cash_movements_read_same_tenant"
on public.cash_movements
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = cash_movements.tenant_id
  )
);

drop policy if exists "cash_movements_insert_same_tenant" on public.cash_movements;
create policy "cash_movements_insert_same_tenant"
on public.cash_movements
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = cash_movements.tenant_id
  )
);

drop policy if exists "cash_movements_update_same_tenant" on public.cash_movements;
create policy "cash_movements_update_same_tenant"
on public.cash_movements
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = cash_movements.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = cash_movements.tenant_id
  )
);

notify pgrst, 'reload schema';
