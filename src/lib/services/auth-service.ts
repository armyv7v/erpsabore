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

function resolveRecoveryRedirectTo(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;

  if (!appUrl) {
    throw new Error(
      "Recuperación no disponible: falta DEP-01 — registra `{APP_URL}/auth/callback` en la allowlist de redirects de Supabase Auth y define NEXT_PUBLIC_APP_URL.",
    );
  }

  return `${appUrl.replace(/\/$/, "")}/auth/callback?next=/update-password`;
}

export async function requestPasswordReset(email: string) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Recuperación no disponible: falta DEP-02 — Supabase/SMTP no está configurado en este entorno y el enlace no se puede enviar.",
    );
  }

  const redirectTo = resolveRecoveryRedirectTo();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateRecoveryPassword(password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Cambio de contraseña no disponible: Supabase no está configurado en este entorno.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("El enlace expiró o es inválido. Solicitá un nuevo enlace de recuperación.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw new Error(error.message);
  }
}
