-- =============================================================================
-- RLS FIX: Permitir al rol 'ventas' descontar stock en productos
-- Simplificado para validación multi-tenant directa y evitar fallos por roles
-- =============================================================================

drop policy if exists "products_update_same_tenant" on public.products;

create policy "products_update_same_tenant"
on public.products for update
to authenticated
using (
  tenant_id = (select tenant_id from public.profiles where id = auth.uid() limit 1)
  and deleted_at is null
)
with check (
  tenant_id = (select tenant_id from public.profiles where id = auth.uid() limit 1)
);

notify pgrst, 'reload schema';
