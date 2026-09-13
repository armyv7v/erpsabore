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

// El bypass de auth para E2E solo es válido fuera de producción: si la var
// llegara a un despliegue productivo, no debe desactivar la autenticación real.
export function isPlaywrightBypassActive() {
  return (
    process.env.PLAYWRIGHT_TEST_BYPASS === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

export function isSupabaseConfigured() {
  if (isPlaywrightBypassActive()) {
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
