create or replace function public.bootstrap_current_user_profile(default_tenant_name text default 'ERP Sabore')
returns table (
  id uuid,
  tenant_id uuid,
  email text,
  full_name text,
  role public.app_role,
  tenant_name text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid;
  current_profile public.profiles%rowtype;
  selected_tenant public.tenants%rowtype;
  resolved_email text;
  resolved_full_name text;
  resolved_slug text;
begin
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

  select
    u.email,
    coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name',
      split_part(coalesce(u.email, ''), '@', 1),
      'Administrador'
    )
  into resolved_email, resolved_full_name
  from auth.users u
  where u.id = current_user_id;

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
  end if;

  insert into public.profiles (id, tenant_id, email, full_name, role)
  values (
    current_user_id,
    selected_tenant.id,
    coalesce(resolved_email, ''),
    coalesce(resolved_full_name, 'Administrador'),
    'admin'
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
end;
$$;

grant execute on function public.bootstrap_current_user_profile(text) to authenticated;
