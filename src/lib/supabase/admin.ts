import { createClient } from "@supabase/supabase-js";
import { assertSupabaseAdminConfigured, getSupabaseAdminEnv } from "@/lib/supabase/config";

export function createSupabaseAdminClient() {
  assertSupabaseAdminConfigured();

  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
