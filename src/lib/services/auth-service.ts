import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole, AuthUser } from "@/lib/types/erp";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureDefaultProfile } from "@/lib/repositories/profile-repository";

export interface AuthContext {
  user: AuthUser;
  supabase: SupabaseClient;
}

export async function getOptionalAuthUser(): Promise<AuthUser | null> {
  const context = await getOptionalAuthContext();
  return context?.user ?? null;
}

export async function getOptionalAuthContext(): Promise<AuthContext | null> {
  if (process.env.PLAYWRIGHT_TEST_BYPASS === "true") {
    return {
      user: {
        id: "mock-e2e-user-id",
        tenantId: "mock-e2e-tenant-id",
        tenantName: "Empresa de Pruebas E2E",
        email: "admin@empresa.cl",
        fullName: "Administrador E2E",
        role: "admin",
      },
      supabase: {} as any,
    };
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();



  if (!user) {
    return null;
  }

  return {
    user: await ensureDefaultProfile(supabase, user),
    supabase,
  };
}

export async function requireAuthenticatedUser() {
  const context = await requireAuthenticatedContext();
  return context.user;
}

export async function requireAuthenticatedContext(): Promise<AuthContext> {
  const context = await getOptionalAuthContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function createAuthenticatedSupabaseClient() {
  const context = await getOptionalAuthContext();
  return context?.supabase ?? await createSupabaseServerClient();
}

export function assertUserHasRole(user: AuthUser, roles: AppRole[]) {
  if (!roles.includes(user.role)) {
    throw new Error("No tienes permisos para ejecutar esta acción.");
  }
}

export async function signInWithPassword(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Configura Supabase antes de iniciar sesión.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  const user = data.user;
  const accessToken = data.session?.access_token;

  if (!user || !accessToken) {
    throw new Error("No se pudo recuperar la sesión autenticada.");
  }

  return ensureDefaultProfile(supabase, user);
}

export async function signOutCurrentUser() {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
