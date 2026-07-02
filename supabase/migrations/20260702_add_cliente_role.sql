-- MIGRATION: Soporte para Rol Cliente y Perfil Vinculado
-- 1. Añadir el valor 'cliente' al tipo enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente';

-- 2. Agregar la columna customer_id a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- 3. Actualizar la función bootstrap_current_user_profile para que resuelva el rol desde raw_user_meta_data
CREATE OR REPLACE FUNCTION public.bootstrap_current_user_profile()
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  email text,
  full_name text,
  role public.app_role,
  tenant_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid;
  current_profile public.profiles%rowtype;
  selected_tenant public.tenants%rowtype;
  resolved_email text;
  resolved_full_name text;
  default_tenant_name text := 'ERP Sabore';
  resolved_slug text;
  resolved_role public.app_role := 'ventas';
  metadata_role text;
BEGIN
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'No authenticated user found for bootstrap.';
  end if;

  select *
  into current_profile
  from public.profiles
  where profiles.id = current_user_id;

  if found then
    return query
    select
      current_profile.id,
      current_profile.tenant_id,
      current_profile.email,
      current_profile.full_name,
      current_profile.role,
      coalesce(t.name, default_tenant_name) as tenant_name
    from public.tenants t
    where t.id = current_profile.tenant_id;
    return;
  end if;

  -- Obtener info del usuario de auth.users
  select
    u.email,
    coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name',
      split_part(coalesce(u.email, ''), '@', 1),
      'Usuario'
    ),
    u.raw_user_meta_data ->> 'role'
  into resolved_email, resolved_full_name, metadata_role
  from auth.users u
  where u.id = current_user_id;

  -- Resolver tenant
  select *
  into selected_tenant
  from public.tenants
  order by created_at asc
  limit 1;

  if not found then
    resolved_slug := lower(default_tenant_name);
    resolved_slug := regexp_replace(resolved_slug, '[^a-z0-9]+', '-', 'g');
    resolved_slug := regexp_replace(resolved_slug, '(^-|-$)', '', 'g');

    insert into public.tenants (name, slug)
    values (default_tenant_name, resolved_slug)
    returning *
    into selected_tenant;

    resolved_role := 'admin';
  else
    -- Si ya existe un tenant y los metadatos tienen un rol válido, usarlo. Si no, queda en 'ventas'.
    if metadata_role in ('admin', 'ventas', 'finanzas', 'bodega', 'rrhh', 'cliente') then
      resolved_role := metadata_role::public.app_role;
    end if;
  end if;

  insert into public.profiles (id, tenant_id, email, full_name, role, status)
  values (
    current_user_id,
    selected_tenant.id,
    coalesce(resolved_email, ''),
    coalesce(resolved_full_name, 'Usuario'),
    resolved_role,
    'active'
  )
  returning *
  into current_profile;

  return query
  select
    current_profile.id,
    current_profile.tenant_id,
    current_profile.email,
    current_profile.full_name,
    current_profile.role,
    selected_tenant.name as tenant_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_current_user_profile() TO authenticated;