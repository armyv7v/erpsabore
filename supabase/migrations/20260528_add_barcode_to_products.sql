-- =============================================================================
-- Migración: Agregar columna barcode a tabla products
-- 2026-05-28
-- =============================================================================

-- 1. Agregar la columna barcode a la tabla de productos si no existe
alter table public.products add column if not exists barcode text;

-- 2. Crear un índice parcial para optimizar búsquedas de códigos de barra activos
create index if not exists idx_products_barcode 
  on public.products (barcode) 
  where deleted_at is null;

-- 3. Notificar a PostgREST para recargar el esquema inmediatamente
notify pgrst, 'reload schema';
