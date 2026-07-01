-- =============================================================================
-- Migración: Agregar columnas de información tributaria y comercial al tenant
-- 2026-07-01
-- =============================================================================

-- 1. Agregar columnas a la tabla tenants
alter table public.tenants 
  add column if not exists rut text,
  add column if not exists razon_social text,
  add column if not exists giro text,
  add column if not exists acteco text,
  add column if not exists direccion text,
  add column if not exists comuna text,
  add column if not exists ciudad text,
  add column if not exists telefono text,
  add column if not exists email text;

-- 2. Poblar los tenants existentes con la información por defecto de SABORÉ SPA
update public.tenants 
set 
  rut = '77.947.538-7',
  razon_social = 'SABORÉ SPA',
  giro = 'Venta al por menor de alimentos y almacenes',
  acteco = '472101',
  direccion = 'Av. Providencia 1234, Oficina 501',
  comuna = 'Providencia',
  ciudad = 'Santiago',
  telefono = '+56 2 2345 6789',
  email = 'contacto@sabore.cl'
where rut is null;

-- 3. Recargar esquema de PostgREST
notify pgrst, 'reload schema';
