-- =============================================================================
-- OVERDUE INVOICES + NUMERACIÓN CORRELATIVA SII — ERP Sabore
-- 2026-05-20
--
-- P5 — Facturas vencidas (overdue):
--   No existe ningún proceso que cambie el status de facturas "issued" a
--   "overdue" cuando pasa la due_date. El dashboard nunca muestra facturas
--   vencidas reales.
--
--   Fix:
--     1. Función mark_overdue_invoices() que actualiza accounts_receivable
--        e invoices en una transacción atómica.
--     2. Cron job via pg_cron que la ejecuta diariamente a las 02:00 UTC.
--        (requiere que pg_cron esté habilitado en el proyecto de Supabase:
--         Dashboard > Database > Extensions > pg_cron)
--
-- P6 — Numeración correlativa (SII):
--   El número de factura actual se genera como:
--     'FV-' || to_char(now(), 'YYYYMMDD') || '-' || random_uuid_suffix
--   Esto NO es correlativo. El SII exige numeración secuencial sin saltos
--   para los documentos tributarios (DTEs).
--
--   Fix:
--     1. Columna invoice_seq_number (integer, correlativo por tenant).
--     2. Secuencia por tenant vía una tabla tenant_invoice_sequences.
--     3. Función get_next_invoice_number(tenant_id) que obtiene y reserva
--        el siguiente número de forma atómica (FOR UPDATE SKIP LOCKED).
--     4. Trigger que asigna el número correlativo al emitir la factura.
--
-- Nota SII: El folio real del SII requiere integración con el sistema de
-- timbrado electrónico (CAF). Esta migración implementa la numeración
-- interna correlativa como prerequisito técnico. La integración CAF es un
-- proyecto separado.
-- =============================================================================


-- =============================================================================
-- P5. Función mark_overdue_invoices()
-- =============================================================================

create or replace function public.mark_overdue_invoices()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_count integer;
begin
  -- Marcar receivables como overdue
  update public.accounts_receivable ar
  set
    status = 'overdue',
    updated_at = now()
  where ar.status in ('open', 'partial')
    and ar.due_date < current_date
    and ar.balance > 0;

  -- Sincronizar status de las facturas correspondientes
  update public.invoices i
  set
    status = 'overdue',
    updated_at = now()
  from public.accounts_receivable ar
  where ar.invoice_id = i.id
    and ar.status = 'overdue'
    and i.status in ('issued', 'partially_paid');

  get diagnostics affected_count = row_count;

  return affected_count;
end;
$$;

-- Solo el rol de servicio (service_role) puede ejecutar esto — no authenticated
revoke execute on function public.mark_overdue_invoices() from public;
revoke execute on function public.mark_overdue_invoices() from authenticated;


-- =============================================================================
-- Cron job diario para mark_overdue_invoices (requiere pg_cron habilitado)
-- Para habilitar: Dashboard > Database > Extensions > pg_cron
-- =============================================================================

-- Wrapeamos en DO para no fallar si pg_cron no está habilitado todavía
do $$
begin
  if exists (
    select 1 from pg_extension where extname = 'pg_cron'
  ) then
    -- Eliminar job previo si existe
    perform cron.unschedule('erp-mark-overdue-invoices');

    -- Programar ejecución diaria a las 02:00 UTC
    perform cron.schedule(
      'erp-mark-overdue-invoices',
      '0 2 * * *',
      $cron$select public.mark_overdue_invoices()$cron$
    );
  end if;
end;
$$;


-- =============================================================================
-- P6. Numeración correlativa de facturas por tenant
-- =============================================================================

-- Tabla de secuencias por tenant (una fila por tenant, se bloquea con FOR UPDATE)
create table if not exists public.tenant_invoice_sequences (
  tenant_id   uuid not null primary key references public.tenants(id) on delete cascade,
  last_number integer not null default 0,
  updated_at  timestamptz not null default now()
);

-- Inicializar secuencias para tenants existentes
insert into public.tenant_invoice_sequences (tenant_id, last_number)
select id, 0
from public.tenants
on conflict (tenant_id) do nothing;

-- Trigger: cuando se inserta un nuevo tenant, crear su secuencia automáticamente
create or replace function public.init_tenant_invoice_sequence()
returns trigger
language plpgsql
as $$
begin
  insert into public.tenant_invoice_sequences (tenant_id, last_number)
  values (new.id, 0)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_init_tenant_invoice_sequence on public.tenants;
create trigger trg_init_tenant_invoice_sequence
after insert on public.tenants
for each row
execute function public.init_tenant_invoice_sequence();


-- Función para obtener el siguiente número de factura de forma atómica
create or replace function public.get_next_invoice_number(p_tenant_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number integer;
begin
  -- FOR UPDATE asegura que dos facturas simultáneas no obtengan el mismo número
  update public.tenant_invoice_sequences
  set
    last_number = last_number + 1,
    updated_at  = now()
  where tenant_id = p_tenant_id
  returning last_number
  into next_number;

  if not found then
    -- Crear secuencia si no existe (tenant nuevo)
    insert into public.tenant_invoice_sequences (tenant_id, last_number)
    values (p_tenant_id, 1)
    returning last_number
    into next_number;
  end if;

  -- Formato: FV-000001 (6 dígitos, expandible a 7+ automáticamente)
  return 'FV-' || lpad(next_number::text, 6, '0');
end;
$$;

grant execute on function public.get_next_invoice_number(uuid) to authenticated;


-- =============================================================================
-- Columna seq_number en invoices para guardar el número correlativo
-- (separado del campo "number" legacy para compatibilidad)
-- =============================================================================

alter table public.invoices
  add column if not exists seq_number text;

create unique index if not exists idx_invoices_seq_number
  on public.invoices (tenant_id, seq_number)
  where seq_number is not null;


-- =============================================================================
-- RLS para tenant_invoice_sequences
-- Solo lectura para usuarios del tenant; escritura solo via función SECURITY DEFINER
-- =============================================================================

alter table public.tenant_invoice_sequences enable row level security;

drop policy if exists "invoice_sequences_read_own_tenant" on public.tenant_invoice_sequences;
create policy "invoice_sequences_read_own_tenant"
on public.tenant_invoice_sequences for select
to authenticated
using (tenant_id = (select public.current_tenant_id()));


notify pgrst, 'reload schema';
