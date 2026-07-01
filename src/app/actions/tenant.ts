"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { isSupabaseConfigured, getSupabaseAdminEnv } from "@/lib/supabase/config";
import { createClient } from "@supabase/supabase-js";
import { updateTenantDetails } from "@/lib/repositories/tenant-repository";
import type { ActionState } from "@/lib/types/erp";

// Esquema Zod de validación tributaria y de contacto
const tenantSettingsSchema = z.object({
  rut: z.string().regex(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, "El RUT debe tener un formato válido (ej: 77.947.538-7)."),
  razonSocial: z.string().min(3, "La razón social debe tener al menos 3 caracteres."),
  giro: z.string().min(3, "El giro comercial debe tener al menos 3 caracteres."),
  acteco: z.string().regex(/^\d{5,6}$/, "El código de actividad económica (Acteco) debe ser numérico de 5 o 6 dígitos."),
  direccion: z.string().min(5, "La dirección debe tener al menos 5 caracteres."),
  comuna: z.string().min(2, "La comuna debe ser seleccionada."),
  ciudad: z.string().min(2, "La ciudad debe ser seleccionada."),
  telefono: z.string().optional().nullable().or(z.literal("")),
  email: z.string().email("El correo electrónico no es válido.").optional().nullable().or(z.literal("")),
});

function getAdminClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin client configuration error in production.");
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function updateTenantDetailsAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { user } = await requireAuthenticatedContext();

    if (user.role !== "admin") {
      throw new Error("No tienes permisos para modificar la configuración de la empresa.");
    }

    const adminSupabase = getAdminClient();

    const rawData = {
      rut: String(formData.get("rut") ?? "").trim(),
      razonSocial: String(formData.get("razonSocial") ?? "").trim(),
      giro: String(formData.get("giro") ?? "").trim(),
      acteco: String(formData.get("acteco") ?? "").trim(),
      direccion: String(formData.get("direccion") ?? "").trim(),
      comuna: String(formData.get("comuna") ?? "").trim(),
      ciudad: String(formData.get("ciudad") ?? "").trim(),
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
    };

    const parsed = tenantSettingsSchema.parse(rawData);

    await updateTenantDetails(adminSupabase, user.tenantId, parsed);

    try {
      revalidatePath("/configuracion");
      revalidatePath("/(dashboard)/configuracion");
    } catch (e) {}

    return {
      status: "success",
      message: "Configuración de empresa guardada con éxito.",
    };
  } catch (error: any) {
    console.error("[updateTenantDetailsAction Error]:", error);
    return {
      status: "error",
      message: error instanceof z.ZodError
        ? error.issues.map((e) => e.message).join(" ")
        : error.message || "Error inesperado al guardar la configuración.",
    };
  }
}
