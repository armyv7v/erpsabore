-- =============================================================================
-- TRIGGER: suppliers.pending_balance — mantener consistencia automática
-- 2026-05-20
--
-- Problema:
--   suppliers.pending_balance es un campo denormalizado que representa el total
--   adeudado a ese proveedor. No existe ningún trigger ni proceso que lo
--   actualice cuando se registran movimientos de caja (cash_movements) de tipo
--   expense asociados a ese proveedor.
--
--   Si alguien registra un pago a un proveedor via cash_movements directamente
--   (fuera del ERP UI), el campo pending_balance nunca se actualiza.
--   Esto afecta las métricas de COGS y cashflow en el dashboard.
--
-- Fix:
--   1. Función sync_supplier_pending_balance() que recalcula el balance
--      leyendo cash_movements de kind='expense' y source_type='supplier'
--      para ese supplier_id.
--
--   2. Trigger on cash_movements: INSERT / UPDATE / DELETE que llama la función
--      cuando el movimiento está relacionado con un proveedor.
--
-- Nota: La función usa sum() sobre cash_movements para mantener consistencia
-- total. No hace delta-update para evitar drift por updates concurrentes.
-- =============================================================================

create or replace function public.sync_supplier_pending_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_supplier_id uuid;
  computed_balance numeric(14,2);
begin
  -- Determinar el supplier_id afectado (puede venir de NEW o OLD)
  target_supplier_id := coalesce(
    case when TG_OP <> 'DELETE' and new.source_type = 'supplier' then new.source_id end,
    case when TG_OP <> 'INSERT' and old.source_type = 'supplier' then old.source_id end
  );

  -- Si el movimiento no está vinculado a un proveedor, no hacer nada
  if target_supplier_id is null then
    return coalesce(new, old);
  end if;

  -- Recalcular el balance total pendiente del proveedor
  -- Solo movimientos de tipo expense que no estén cancelados
  select coalesce(sum(cm.amount), 0)
  into computed_balance
  from public.cash_movements cm
  where cm.source_type = 'supplier'
    and cm.source_id   = target_supplier_id
    and cm.kind        = 'expense'
    and cm.status     <> 'cancelled';

  -- Actualizar el campo denormalizado en suppliers
  update public.suppliers
  set
    pending_balance = computed_balance,
    updated_at      = now()
  where id = target_supplier_id;

  return coalesce(new, old);
end;
$$;

-- Trigger: se activa en cualquier cambio en cash_movements que afecte proveedores
drop trigger if exists trg_sync_supplier_balance on public.cash_movements;

create trigger trg_sync_supplier_balance
after insert or update or delete
on public.cash_movements
for each row
when (
  -- Solo cuando el movimiento involucra un proveedor
  coalesce(new.source_type, old.source_type) = 'supplier'
  and coalesce(new.kind, old.kind)           = 'expense'
)
execute function public.sync_supplier_pending_balance();


-- =============================================================================
-- RLS faltante en suppliers (la tabla no tenía enable row level security)
-- =============================================================================

alter table public.suppliers enable row level security;

drop policy if exists "suppliers_read_same_tenant" on public.suppliers;
create policy "suppliers_read_same_tenant"
on public.suppliers for select
to authenticated
using (
  tenant_id = (select public.current_tenant_id())
  and deleted_at is null
);

drop policy if exists "suppliers_insert_same_tenant" on public.suppliers;
create policy "suppliers_insert_same_tenant"
on public.suppliers for insert
to authenticated
with check (
  tenant_id = (select public.current_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = (select public.current_tenant_id())
      and p.role in ('admin', 'finanzas')
  )
);

drop policy if exists "suppliers_update_same_tenant" on public.suppliers;
create policy "suppliers_update_same_tenant"
on public.suppliers for update
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
      and p.role in ('admin', 'finanzas')
  )
);


-- Índice para búsqueda de movimientos por proveedor (usado por el trigger)
create index if not exists idx_cash_movements_supplier
  on public.cash_movements (source_id, source_type, kind, status)
  where source_type = 'supplier' and kind = 'expense';

notify pgrst, 'reload schema';
