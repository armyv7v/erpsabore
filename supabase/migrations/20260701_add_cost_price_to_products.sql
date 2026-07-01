-- Agregar columna cost_price a la tabla products
alter table public.products add column if not exists cost_price numeric(14,2) not null default 0;

-- Recargar esquema de PostgREST
notify pgrst, 'reload schema';
