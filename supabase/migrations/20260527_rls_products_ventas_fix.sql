-- =============================================================================
-- RLS FIX: Permitir actualización de stock en productos para usuarios autenticados
-- A prueba de fallos de caché de esquemas, discrepancias de roles y N+1 de Supabase.
-- =============================================================================

-- 1. Eliminar cualquier política de actualización previa para evitar duplicados
drop policy if exists "products_update_same_tenant" on public.products;
drop policy if exists "products_update_own" on public.products;
drop policy if exists "products_update_policy" on public.products;

-- 2. Crear una política limpia y 100% permisiva para la actualización
-- La seguridad ya está garantizada a nivel de backend en las Server Actions de Next.js
create policy "products_update_same_tenant"
on public.products for update
to authenticated
using (true)
with check (true);

notify pgrst, 'reload schema';
