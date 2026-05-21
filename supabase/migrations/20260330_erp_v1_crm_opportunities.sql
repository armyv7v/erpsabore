create table if not exists public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  stage text not null check (stage in ('prospect', 'qualified', 'proposal', 'negotiation', 'closed')),
  amount numeric(14,2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_opportunities_tenant_stage on public.crm_opportunities(tenant_id, stage, created_at desc);

alter table public.crm_opportunities enable row level security;

drop policy if exists "crm_opportunities_read_same_tenant" on public.crm_opportunities;
create policy "crm_opportunities_read_same_tenant"
on public.crm_opportunities
for select
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists "crm_opportunities_insert_same_tenant" on public.crm_opportunities;
create policy "crm_opportunities_insert_same_tenant"
on public.crm_opportunities
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists "crm_opportunities_update_same_tenant" on public.crm_opportunities;
create policy "crm_opportunities_update_same_tenant"
on public.crm_opportunities
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

notify pgrst, 'reload schema';
