"use client";

import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseConfigured, getSupabaseEnv } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  assertSupabaseConfigured();
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
