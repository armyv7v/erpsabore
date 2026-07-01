-- =============================================================================
-- Migración: Agregar tablas para comunicados de RRHH y solicitudes de vacaciones
-- 2026-07-01
-- =============================================================================

-- 1. Agregar columna vacation_days_left a la tabla de empleados
alter table public.employees 
  add column if not exists vacation_days_left integer not null default 15;

-- 2. Crear tabla de comunicados (announcements)
create table if not exists public.hr_announcements (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  title           text not null,
  category        text not null default 'Empresa',
  category_color  text not null default 'text-primary',
  image_url       text,
  content         text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- Habilitar RLS en hr_announcements
alter table public.hr_announcements enable row level security;

-- Políticas de RLS para hr_announcements
drop policy if exists "announcements_read_same_tenant" on public.hr_announcements;
create policy "announcements_read_same_tenant"
on public.hr_announcements for select
to authenticated
using (
  tenant_id = (select public.current_tenant_id())
  and deleted_at is null
);

drop policy if exists "announcements_insert_same_tenant" on public.hr_announcements;
create policy "announcements_insert_same_tenant"
on public.hr_announcements for insert
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

drop policy if exists "announcements_update_same_tenant" on public.hr_announcements;
create policy "announcements_update_same_tenant"
on public.hr_announcements for update
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

drop policy if exists "announcements_delete_same_tenant" on public.hr_announcements;
create policy "announcements_delete_same_tenant"
on public.hr_announcements for delete
to authenticated
using (
  tenant_id = (select public.current_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = (select public.current_tenant_id())
      and p.role in ('admin', 'rrhh')
  )
);


-- 3. Crear tabla de solicitudes de vacaciones (vacation_requests)
create table if not exists public.hr_vacation_requests (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  employee_id     uuid not null references public.employees(id) on delete cascade,
  start_date      date not null,
  end_date        date not null,
  days_requested  integer not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  notes           text,
  approved_by     uuid references public.profiles(id) on delete set null,
  approved_at     timestamptz,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- Habilitar RLS en hr_vacation_requests
alter table public.hr_vacation_requests enable row level security;

-- Políticas de RLS para hr_vacation_requests
drop policy if exists "vacations_read_same_tenant" on public.hr_vacation_requests;
create policy "vacations_read_same_tenant"
on public.hr_vacation_requests for select
to authenticated
using (
  tenant_id = (select public.current_tenant_id())
  and deleted_at is null
);

drop policy if exists "vacations_insert_same_tenant" on public.hr_vacation_requests;
create policy "vacations_insert_same_tenant"
on public.hr_vacation_requests for insert
to authenticated
with check (
  tenant_id = (select public.current_tenant_id())
);

drop policy if exists "vacations_update_same_tenant" on public.hr_vacation_requests;
create policy "vacations_update_same_tenant"
on public.hr_vacation_requests for update
to authenticated
using (
  tenant_id = (select public.current_tenant_id())
  and deleted_at is null
)
with check (
  tenant_id = (select public.current_tenant_id())
);

drop policy if exists "vacations_delete_same_tenant" on public.hr_vacation_requests;
create policy "vacations_delete_same_tenant"
on public.hr_vacation_requests for delete
to authenticated
using (
  tenant_id = (select public.current_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = (select public.current_tenant_id())
      and p.role in ('admin', 'rrhh')
  )
);

-- Recargar esquema PostgREST
notify pgrst, 'reload schema';
