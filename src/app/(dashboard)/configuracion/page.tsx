import React from "react";
import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { isSupabaseConfigured, getSupabaseAdminEnv } from "@/lib/supabase/config";
import { getTenantDetails } from "@/lib/repositories/tenant-repository";
import { createClient } from "@supabase/supabase-js";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const currentUser = await requireAuthenticatedUser();
  const dbConfigured = isSupabaseConfigured();

  let tenantDetails;

  if (dbConfigured) {
    const { url, serviceRoleKey } = getSupabaseAdminEnv();
    const adminSupabase = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    tenantDetails = await getTenantDetails(adminSupabase, currentUser.tenantId);
  } else {
    // Modo Fallback con datos Mock
    tenantDetails = await getTenantDetails(null, "mock");
  }

  return <SettingsClient initialDetails={tenantDetails} />;
}
