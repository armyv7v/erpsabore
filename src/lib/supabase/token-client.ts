import { createClient } from "@supabase/supabase-js";
import { assertSupabaseConfigured, getSupabaseEnv } from "@/lib/supabase/config";

export function createSupabaseTokenClient(accessToken: string) {
  assertSupabaseConfigured();
  const { url, anonKey } = getSupabaseEnv();

  return createClient(url, anonKey, {
    accessToken: async () => accessToken,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
