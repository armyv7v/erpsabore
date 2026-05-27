-- =============================================================================
-- DATABASE SCHEMA: Gestión de Jornadas y Cierres de Caja (Arqueo)
-- =============================================================================

create table if not exists public.cash_shifts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  opened_by uuid not null references public.profiles(id) on delete restrict,
  closed_by uuid references public.profiles(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete set null,
  
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  
  initial_cash numeric(14,2) not null default 0,
  expected_cash numeric(14,2) not null default 0,
  expected_debit numeric(14,2) not null default 0,
  expected_credit numeric(14,2) not null default 0,
  expected_transfer numeric(14,2) not null default 0,
  
  actual_cash numeric(14,2) default 0,
  actual_debit numeric(14,2) default 0,
  actual_credit numeric(14,2) default 0,
  actual_transfer numeric(14,2) default 0,
  
  notes text,
  status text not null default 'open' check (status in ('open', 'closed')),
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS habilitado
alter table public.cash_shifts enable row level security;

-- Políticas de RLS para cash_shifts
drop policy if exists "cash_shifts_read_same_tenant" on public.cash_shifts;
create policy "cash_shifts_read_same_tenant"
on public.cash_shifts for select
to authenticated
using (tenant_id = (select tenant_id from public.profiles where id = auth.uid()));

drop policy if exists "cash_shifts_insert_same_tenant" on public.cash_shifts;
create policy "cash_shifts_insert_same_tenant"
on public.cash_shifts for insert
to authenticated
with check (tenant_id = (select tenant_id from public.profiles where id = auth.uid()));

drop policy if exists "cash_shifts_update_same_tenant" on public.cash_shifts;
create policy "cash_shifts_update_same_tenant"
on public.cash_shifts for update
to authenticated
using (tenant_id = (select tenant_id from public.profiles where id = auth.uid()));

-- Índices optimizados
create index if not exists idx_cash_shifts_tenant_status on public.cash_shifts(tenant_id, status);
create index if not exists idx_cash_shifts_opened_by on public.cash_shifts(opened_by);

notify pgrst, 'reload schema';
