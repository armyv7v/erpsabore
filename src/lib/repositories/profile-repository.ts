import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AuthUser, AppRole, ManagedUserRecord, ProfileStatus } from "@/lib/types/erp";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
}

interface ProfileRow {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  status?: ProfileStatus;
  created_at?: string;
  updated_at?: string;
  tenant?: TenantRow | null;
}

interface BootstrapProfileRow {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  tenant_name: string;
}

function toAuthUser(profile: ProfileRow, fallbackTenantName?: string): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    tenantId: profile.tenant_id,
    tenantName: profile.tenant?.name ?? fallbackTenantName ?? "ERP Sabore",
  };
}

export async function getProfileByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, tenant_id, email, full_name, role, tenant:tenants(id, name, slug)")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const profile = data as unknown as ProfileRow;

  if (profile.status === "inactive") {
    return null;
  }

  return toAuthUser(profile);
}

function toManagedUser(profile: ProfileRow): ManagedUserRecord {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    status: profile.status ?? "active",
    tenantId: profile.tenant_id,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export async function listTenantUsers(supabase: SupabaseClient, tenantId: string): Promise<ManagedUserRecord[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, tenant_id, email, full_name, role, status, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No se pudieron cargar los usuarios del tenant.");
  }

  return ((data ?? []) as ProfileRow[]).map(toManagedUser);
}

export async function listTenantUsersWithAdminClient(supabase: SupabaseClient, tenantId: string): Promise<ManagedUserRecord[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, tenant_id, email, full_name, role, status, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar los usuarios del tenant. ${error.message}`);
  }

  return ((data ?? []) as ProfileRow[]).map(toManagedUser);
}

export async function updateTenantUser(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    userId: string;
    fullName?: string;
    role?: AppRole;
    status?: ProfileStatus;
  },
) {
  const payload: Record<string, string> = {};

  if (typeof input.fullName === "string") {
    payload.full_name = input.fullName;
  }

  if (input.role) {
    payload.role = input.role;
  }

  if (input.status) {
    payload.status = input.status;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("tenant_id", input.tenantId)
    .eq("id", input.userId)
    .select("id, tenant_id, email, full_name, role, status, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error("No se pudo actualizar el usuario.");
  }

  return toManagedUser(data as ProfileRow);
}

export async function ensureDefaultProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<AuthUser> {
  const existingProfile = await getProfileByUserId(supabase, user.id);

  if (existingProfile) {
    return existingProfile;
  }

  const { data, error } = await supabase.rpc("bootstrap_current_user_profile");

  const bootstrapRow = Array.isArray(data) ? data[0] : data;

  if (error || !bootstrapRow) {
    throw new Error(`No se pudo bootstrapear el perfil del usuario.${error ? ` ${error.message}` : ""}`);
  }

  const row = bootstrapRow as BootstrapProfileRow;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
  };
}
