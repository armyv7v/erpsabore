-- =============================================================================
-- FIX: current_tenant_id() — Evitar inlining de Postgres y recursión RLS
-- 2026-05-20
--
-- Causa raíz:
--   Al usar `language sql`, PostgreSQL "inlinea" (inlines) la función dentro de
--   las políticas de RLS. Esto hace que se ejecute con el contexto y privilegios
--   del usuario autenticado en lugar del contexto `security definer`.
--   Al evaluar el RLS de `public.profiles` (necesario para leer el tenant_id),
--   se genera una evaluación recursiva o un fallo silencioso que retorna NULL,
--   impidiendo que los usuarios carguen sus propios registros.
--
-- Solución:
--   Redefinir la función usando `language plpgsql`. PostgreSQL nunca inlinea
--   funciones PL/pgSQL, forzando a que se respete siempre el atributo
--   `security definer` y bypassando el RLS sobre la tabla profiles correctamente.
-- =============================================================================

create or replace function public.current_tenant_id()
returns uuid
language plpgsql
stable
parallel safe
security definer
set search_path = public
as $$
declare
  val uuid;
begin
  select tenant_id into val
  from public.profiles
  where id = auth.uid()
  limit 1;
  return val;
end;
$$;

-- Recargar schema de PostgREST para aplicar cambios inmediatamente
notify pgrst, 'reload schema';
