"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState, AppRole, ProfileStatus } from "@/lib/types/erp";
import { assertUserHasRole, requireAuthenticatedContext } from "@/lib/services/auth-service";
import { updateTenantUser } from "@/lib/repositories/profile-repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminConfigured } from "@/lib/supabase/config";

const userRoleSchema = z.enum(["admin", "ventas", "finanzas", "bodega", "rrhh"] satisfies [AppRole, ...AppRole[]]);
const userStatusSchema = z.enum(["active", "inactive"] satisfies [ProfileStatus, ...ProfileStatus[]]);

const createUserSchema = z.object({
  email: z.string().email("Ingresa un correo válido."),
  fullName: z.string().trim().min(3, "Ingresa el nombre completo."),
  role: userRoleSchema,
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

const updateUserSchema = z.object({
  userId: z.string().uuid("Usuario inválido."),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
});

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

function revalidateUsersPaths() {
  revalidatePath("/usuarios");
}

export async function submitCreateManagedUserAction(formData: FormData): Promise<ActionState> {
  try {
    const { user } = await requireAuthenticatedContext();
    assertUserHasRole(user, ["admin"]);

    if (!hasSupabaseAdminConfigured()) {
      throw new Error("Falta configurar SUPABASE_SERVICE_ROLE_KEY para crear usuarios desde el ERP.");
    }

    const parsed = createUserSchema.parse({
      email: formData.get("email"),
      fullName: formData.get("fullName"),
      role: formData.get("role"),
      password: formData.get("password"),
    });

    const adminSupabase = createSupabaseAdminClient();
    const { data: createdAuthUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: parsed.email,
      password: parsed.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.fullName,
      },
      app_metadata: {
        role: parsed.role,
      },
    });

    if (createError || !createdAuthUser.user) {
      throw new Error(createError?.message ?? "No se pudo crear el usuario en autenticación.");
    }

    const { error: profileError } = await adminSupabase
      .from("profiles")
      .insert({
        id: createdAuthUser.user.id,
        tenant_id: user.tenantId,
        email: parsed.email,
        full_name: parsed.fullName,
        role: parsed.role,
        status: "active",
      });

    if (profileError) {
      await adminSupabase.auth.admin.deleteUser(createdAuthUser.user.id);
      throw new Error(`No se pudo crear el perfil del usuario. ${profileError.message}`);
    }

    revalidateUsersPaths();

    return {
      status: "success",
      message: "Usuario creado correctamente.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo crear el usuario."),
    };
  }
}

export async function submitUpdateManagedUserAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    assertUserHasRole(user, ["admin"]);

    const parsed = updateUserSchema.parse({
      userId: formData.get("userId"),
      role: formData.get("role") || undefined,
      status: formData.get("status") || undefined,
    });

    if (parsed.userId === user.id && parsed.status === "inactive") {
      throw new Error("No puedes desactivarte a vos mismo.");
    }

    await updateTenantUser(supabase, {
      tenantId: user.tenantId,
      userId: parsed.userId,
      role: parsed.role,
      status: parsed.status,
    });

    revalidateUsersPaths();

    return {
      status: "success",
      message: "Usuario actualizado correctamente.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo actualizar el usuario."),
    };
  }
}
