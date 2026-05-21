-- =============================================================================
-- INVENTARIO REAL — ERP Sabore
-- 2026-05-20
--
-- Contexto:
--   La tabla public.products ya existe pero solo tiene columnas de catálogo
--   (name, sku, unit_price). No tiene gestión de stock.
--   El módulo de inventario y las métricas P&L usaban mock data de TypeScript
--   con cantidades y estados hardcodeados.
--
-- Qué hace esta migración:
--   1. Agrega columnas de inventario a public.products:
--      - stock_quantity: cantidad en unidades
--      - stock_min_quantity: umbral de alerta de stock bajo
--      - stock_status: normal | low | out_of_stock (generado automáticamente)
--      - image_url: URL de imagen del catálogo
--
--   2. Crea trigger que mantiene stock_status sincronizado automáticamente
--      al cambiar stock_quantity o stock_min_quantity.
--
--   3. Agrega RLS a public.products (faltaba completamente).
--
--   4. Agrega índice de búsqueda por SKU (tenant_id, sku).
-- =============================================================================


-- =============================================================================
-- 1. Columnas de inventario en products
-- =============================================================================

alter table public.products
  add column if not exists stock_quantity   integer not null default 0  check (stock_quantity >= 0),
  add column if not exists stock_min_quantity integer not null default 10 check (stock_min_quantity >= 0),
  add column if not exists stock_status     text    not null default 'out_of_stock'
                                              check (stock_status in ('normal', 'low', 'out_of_stock')),
  add column if not exists image_url        text;


-- =============================================================================
-- 2. Trigger para mantener stock_status consistente automáticamente
-- =============================================================================

create or replace function public.sync_product_stock_status()
returns trigger
language plpgsql
as $$
begin
  new.stock_status := case
    when new.stock_quantity = 0                            then 'out_of_stock'
    when new.stock_quantity <= new.stock_min_quantity      then 'low'
    else                                                        'normal'
  end;
  return new;
end;
$$;

drop trigger if exists trg_sync_product_stock_status on public.products;

create trigger trg_sync_product_stock_status
before insert or update of stock_quantity, stock_min_quantity
on public.products
for each row
execute function public.sync_product_stock_status();


-- =============================================================================
-- 3. RLS en products (faltaba completamente)
-- =============================================================================

alter table public.products enable row level security;

drop policy if exists "products_read_same_tenant" on public.products;
create policy "products_read_same_tenant"
on public.products for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and deleted_at is null
);

drop policy if exists "products_insert_same_tenant" on public.products;
create policy "products_insert_same_tenant"
on public.products for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = public.current_tenant_id()
      and p.role in ('admin', 'bodega')
  )
);

drop policy if exists "products_update_same_tenant" on public.products;
create policy "products_update_same_tenant"
on public.products for update
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and deleted_at is null
)
with check (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = public.current_tenant_id()
      and p.role in ('admin', 'bodega')
  )
);

drop policy if exists "products_delete_same_tenant" on public.products;
create policy "products_delete_same_tenant"
on public.products for delete
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = public.current_tenant_id()
      and p.role = 'admin'
  )
);


-- =============================================================================
-- 4. Índice de búsqueda por SKU
-- =============================================================================

create index if not exists idx_products_sku
  on public.products (tenant_id, sku)
  where deleted_at is null;

create index if not exists idx_products_stock_status
  on public.products (tenant_id, stock_status)
  where deleted_at is null;


-- Recargar schema de PostgREST
notify pgrst, 'reload schema';
