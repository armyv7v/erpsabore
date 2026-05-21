-- =============================================================================
-- RLS y migration para empleados, sucursales y despachos
-- 2026-05-20
--
-- Cubre:
--   1. RLS en la tabla employees (faltaba completamente)
--   2. Tabla branches (sucursales) nueva
--   3. Tabla shipments (despachos) nueva
-- =============================================================================


-- =============================================================================
-- 1. RLS en employees
-- =============================================================================

alter table public.employees enable row level security;

drop policy if exists "employees_read_same_tenant" on public.employees;
create policy "employees_read_same_tenant"
on public.employees for select
to authenticated
using (
  tenant_id = (select public.current_tenant_id())
  and deleted_at is null
);

drop policy if exists "employees_insert_same_tenant" on public.employees;
create policy "employees_insert_same_tenant"
on public.employees for insert
to authenticated
with check (
  tenant_id = (select public.current_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = (select public.current_tenant_id())
      and p.role in ('admin', 'rrhh')
  )
);

drop policy if exists "employees_update_same_tenant" on public.employees;
create policy "employees_update_same_tenant"
on public.employees for update
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
      and p.role in ('admin', 'rrhh')
  )
);

-- Soft delete: solo admin
drop policy if exists "employees_delete_same_tenant" on public.employees;
create policy "employees_delete_same_tenant"
on public.employees for update
to authenticated
using (
  tenant_id = (select public.current_tenant_id())
)
with check (
  tenant_id = (select public.current_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = (select public.current_tenant_id())
      and p.role = 'admin'
  )
);

create index if not exists idx_employees_tenant_status
  on public.employees (tenant_id, status)
  where deleted_at is null;


-- =============================================================================
-- 2. Tabla branches (sucursales)
-- =============================================================================

create table if not exists public.branches (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete restrict,
  name        text not null,
  address     text,
  city        text,
  region      text,
  phone       text,
  email       text,
  manager     text,
  status      text not null default 'active'
                check (status in ('active', 'inactive', 'maintenance')),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists idx_branches_tenant
  on public.branches (tenant_id)
  where deleted_at is null;

alter table public.branches enable row level security;

drop policy if exists "branches_read_same_tenant" on public.branches;
create policy "branches_read_same_tenant"
on public.branches for select
to authenticated
using (
  tenant_id = (select public.current_tenant_id())
  and deleted_at is null
);

drop policy if exists "branches_insert_same_tenant" on public.branches;
create policy "branches_insert_same_tenant"
on public.branches for insert
to authenticated
with check (
  tenant_id = (select public.current_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = (select public.current_tenant_id())
      and p.role = 'admin'
  )
);

drop policy if exists "branches_update_same_tenant" on public.branches;
create policy "branches_update_same_tenant"
on public.branches for update
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
      and p.role = 'admin'
  )
);


-- =============================================================================
-- 3. Tabla shipments (despachos)
-- =============================================================================

create type if not exists public.shipment_status as enum (
  'pending',
  'in_transit',
  'delivered',
  'failed',
  'cancelled'
);

create table if not exists public.shipments (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete restrict,
  invoice_id      uuid references public.invoices(id) on delete set null,
  customer_id     uuid references public.customers(id) on delete set null,
  branch_id       uuid references public.branches(id) on delete set null,

  -- Datos del despacho
  tracking_code   text,
  carrier         text,
  origin_address  text,
  dest_address    text not null,
  dest_city       text,
  dest_region     text,

  -- Fechas
  scheduled_date  date,
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  estimated_at    timestamptz,

  status          public.shipment_status not null default 'pending',
  notes           text,

  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_shipments_tenant_status
  on public.shipments (tenant_id, status, scheduled_date desc);
create index if not exists idx_shipments_invoice
  on public.shipments (invoice_id)
  where invoice_id is not null;
create index if not exists idx_shipments_customer
  on public.shipments (customer_id)
  where customer_id is not null;

alter table public.shipments enable row level security;

drop policy if exists "shipments_read_same_tenant" on public.shipments;
create policy "shipments_read_same_tenant"
on public.shipments for select
to authenticated
using (tenant_id = (select public.current_tenant_id()));

drop policy if exists "shipments_insert_same_tenant" on public.shipments;
create policy "shipments_insert_same_tenant"
on public.shipments for insert
to authenticated
with check (
  tenant_id = (select public.current_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = (select public.current_tenant_id())
      and p.role in ('admin', 'bodega', 'ventas')
  )
);

drop policy if exists "shipments_update_same_tenant" on public.shipments;
create policy "shipments_update_same_tenant"
on public.shipments for update
to authenticated
using (tenant_id = (select public.current_tenant_id()))
with check (
  tenant_id = (select public.current_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = (select public.current_tenant_id())
      and p.role in ('admin', 'bodega')
  )
);

notify pgrst, 'reload schema';
