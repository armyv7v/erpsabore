-- =============================================================================
-- RLS FIX: Permitir al rol 'ventas' descontar stock en productos
-- =============================================================================

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
      and p.role in ('admin', 'bodega', 'ventas')
  )
);

notify pgrst, 'reload schema';
