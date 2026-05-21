export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

export function getSupabaseAdminEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  };
}

export function isSupabaseConfigured() {
  if (process.env.PLAYWRIGHT_TEST_BYPASS === "true") {
    return false;
  }
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
}

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no esta configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

export function hasSupabaseAdminConfigured() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  return Boolean(url && serviceRoleKey);
}

export function assertSupabaseAdminConfigured() {
  if (!hasSupabaseAdminConfigured()) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para crear usuarios nuevos desde la app.");
  }
}
