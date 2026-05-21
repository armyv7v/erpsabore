import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { assertSupabaseConfigured, getSupabaseEnv } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  assertSupabaseConfigured();

  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        } catch {
          // Server Components cannot always mutate cookies. Middleware and actions handle refresh.
        }
      },
    },
  });
}
