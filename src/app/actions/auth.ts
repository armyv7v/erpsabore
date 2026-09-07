"use server";

import { redirect } from "next/navigation";
import { forgotPasswordSchema, loginSchema, registerSchema, updatePasswordSchema } from "@/lib/validators/auth";
import {
  requestPasswordReset,
  signInWithPassword,
  signOutCurrentUser,
  updateRecoveryPassword,
} from "@/lib/services/auth-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/erp";

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const credentials = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    await signInWithPassword(credentials.email, credentials.password);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo iniciar sesión.",
    };
  }

  redirect("/");
}

export async function registerClientAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const data = registerSchema.parse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      rut: formData.get("rut"),
      password: formData.get("password"),
    });

    const supabase = await createSupabaseServerClient();
    
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: "cliente",
        },
      },
    });

    if (authError || !authData.user) {
      return {
        status: "error",
        message: authError?.message || "No se pudo registrar el usuario.",
      };
    }

    const userId = authData.user.id;

    // 2. Usar admin client para operaciones post-signup (el usuario recién
    //    creado no tiene perfil aún, así que RLS bloquea lectura de tenants)
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const { hasSupabaseAdminConfigured } = await import("@/lib/supabase/config");

    if (!hasSupabaseAdminConfigured()) {
      return {
        status: "error",
        message: "El sistema no está configurado para registrar clientes. Contacte al administrador.",
      };
    }

    const adminSupabase = createSupabaseAdminClient();

    // 3. Buscar el primer tenant
    const { data: tenant } = await adminSupabase
      .from("tenants")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!tenant) {
      return {
        status: "error",
        message: "No se encontró ningún tenant de empresa en el sistema.",
      };
    }

    // 4. Buscar o crear la entidad customer por RUT
    let customerId: string | null = null;
    const { data: existingCustomer } = await adminSupabase
      .from("customers")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("rut", data.rut)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await adminSupabase
        .from("customers")
        .insert({
          tenant_id: tenant.id,
          name: data.fullName,
          rut: data.rut,
          email: data.email,
        })
        .select("id")
        .single();

      if (!customerError && newCustomer) {
        customerId = newCustomer.id;
      }
    }

    // 5. Crear el perfil del usuario de tipo cliente vinculado al customer
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .insert({
        id: userId,
        tenant_id: tenant.id,
        email: data.email,
        full_name: data.fullName,
        role: "cliente",
        customer_id: customerId,
        status: "active",
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      await adminSupabase
        .from("profiles")
        .update({
          role: "cliente",
          customer_id: customerId,
        })
        .eq("id", userId);
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Error al registrar el cliente.",
    };
  }

  redirect("/");
}

export async function logoutAction() {
  await signOutCurrentUser();
  redirect("/login");
}

export async function requestPasswordResetAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const data = forgotPasswordSchema.parse({
      email: formData.get("email"),
    });

    await requestPasswordReset(data.email);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo enviar el enlace de recuperación.",
    };
  }

  return {
    status: "success",
    message:
      "Si existe una cuenta con ese correo, enviamos un enlace para restablecer tu contraseña. Revisá tu bandeja de entrada y spam.",
  };
}

export async function updatePasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const data = updatePasswordSchema.parse({
      password: formData.get("password"),
      confirm: formData.get("confirm"),
    });

    await updateRecoveryPassword(data.password);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo actualizar la contraseña.",
    };
  }

  return {
    status: "success",
    message: "Contraseña actualizada. Ya podés iniciar sesión con tu nueva clave.",
  };
}
