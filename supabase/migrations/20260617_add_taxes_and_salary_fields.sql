-- =============================================================================
-- Migración: Agregar campos de impuestos, salario y cotizaciones Previsionales
-- 2026-06-17
-- =============================================================================

-- 1. Agregar columnas a la tabla de empleados (para cálculo de Previred)
alter table public.employees 
  add column if not exists base_salary numeric(14,2) not null default 500000,
  add column if not exists contract_type text not null default 'indefinite' 
    check (contract_type in ('indefinite', 'fixed_term')),
  add column if not exists afp_name text not null default 'Modelo'
    check (afp_name in ('Habitat', 'Modelo', 'Provida', 'Capital', 'Cuprum', 'Planvital', 'Uno')),
  add column if not exists health_system text not null default 'fonasa'
    check (health_system in ('fonasa', 'isapre'));

-- 2. Agregar columna tax_amount a cash_movements (para IVA Crédito de compras)
alter table public.cash_movements
  add column if not exists tax_amount numeric(14,2) not null default 0;

-- Recargar esquema PostgREST
notify pgrst, 'reload schema';
