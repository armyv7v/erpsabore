create table if not exists public.sales_quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_rut text,
  customer_email text,
  source_opportunity_id uuid references public.crm_opportunities(id) on delete set null,
  description text not null,
  amount numeric(14,2) not null default 0,
  notes text,
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected', 'converted')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sales_quotes_tenant_status on public.sales_quotes(tenant_id, status, created_at desc);

alter table public.sales_quotes enable row level security;

drop policy if exists "sales_quotes_read_same_tenant" on public.sales_quotes;
create policy "sales_quotes_read_same_tenant"
on public.sales_quotes
for select to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists "sales_quotes_insert_same_tenant" on public.sales_quotes;
create policy "sales_quotes_insert_same_tenant"
on public.sales_quotes
for insert to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists "sales_quotes_update_same_tenant" on public.sales_quotes;
create policy "sales_quotes_update_same_tenant"
on public.sales_quotes
for update to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

notify pgrst, 'reload schema';
