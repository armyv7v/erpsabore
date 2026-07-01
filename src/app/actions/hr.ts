"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { isSupabaseConfigured, getSupabaseAdminEnv } from "@/lib/supabase/config";
import { createClient } from "@supabase/supabase-js";
import { createAnnouncement, deleteAnnouncement } from "@/lib/repositories/announcement-repository";
import { createVacationRequest, updateVacationRequestStatus } from "@/lib/repositories/vacation-repository";
import type { ActionState } from "@/lib/types/erp";

// Esquemas de validación con Zod
const announcementSchema = z.object({
  title: z.string().min(3, "El título del comunicado debe tener al menos 3 caracteres."),
  category: z.string().min(2, "La categoría debe ser seleccionada."),
  categoryColor: z.string().default("text-primary"),
  imageUrl: z.string().url("La URL de la imagen no es válida.").optional().nullable().or(z.literal("")),
  content: z.string().min(10, "El contenido debe tener al menos 10 caracteres."),
});

const vacationRequestSchema = z.object({
  employeeId: z.string().uuid("ID de empleado no válido."),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de inicio no válida (formato YYYY-MM-DD)."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de término no válida (formato YYYY-MM-DD)."),
  daysRequested: z.coerce.number().int().positive("La cantidad de días debe ser un número entero positivo."),
  notes: z.string().optional().nullable(),
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

export async function createAnnouncementAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { user } = await requireAuthenticatedContext();
    const adminSupabase = getAdminClient();

    const rawData = {
      title: String(formData.get("title") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      categoryColor: String(formData.get("categoryColor") ?? "text-primary").trim(),
      imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
      content: String(formData.get("content") ?? "").trim(),
    };

    const parsed = announcementSchema.parse(rawData);

    await createAnnouncement(adminSupabase, user.tenantId, {
      ...parsed,
      createdBy: user.id,
    });

    revalidatePath("/rrhh/portal");

    return {
      status: "success",
      message: "Comunicado publicado exitosamente.",
    };
  } catch (error: any) {
    console.error("[createAnnouncementAction Error]:", error);
    return {
      status: "error",
      message: error instanceof z.ZodError
        ? error.issues.map((e) => e.message).join(" ")
        : error.message || "Error inesperado al publicar comunicado.",
    };
  }
}

export async function deleteAnnouncementAction(id: string): Promise<ActionState> {
  try {
    const { user } = await requireAuthenticatedContext();
    const adminSupabase = getAdminClient();

    await deleteAnnouncement(adminSupabase, user.tenantId, id);

    revalidatePath("/rrhh/portal");

    return {
      status: "success",
      message: "Comunicado eliminado exitosamente.",
    };
  } catch (error: any) {
    console.error("[deleteAnnouncementAction Error]:", error);
    return {
      status: "error",
      message: error.message || "Error inesperado al eliminar comunicado.",
    };
  }
}

export async function createVacationRequestAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { user } = await requireAuthenticatedContext();
    const adminSupabase = getAdminClient();

    const rawData = {
      employeeId: String(formData.get("employeeId") ?? "").trim(),
      startDate: String(formData.get("startDate") ?? "").trim(),
      endDate: String(formData.get("endDate") ?? "").trim(),
      daysRequested: formData.get("daysRequested"),
      notes: String(formData.get("notes") ?? "").trim() || null,
    };

    const parsed = vacationRequestSchema.parse(rawData);

    await createVacationRequest(adminSupabase, user.tenantId, {
      ...parsed,
      employeeName: user.fullName, // para el fallback en memoria
      createdBy: user.id,
    });

    revalidatePath("/rrhh/portal");

    return {
      status: "success",
      message: "Solicitud de vacaciones enviada exitosamente.",
    };
  } catch (error: any) {
    console.error("[createVacationRequestAction Error]:", error);
    return {
      status: "error",
      message: error instanceof z.ZodError
        ? error.issues.map((e) => e.message).join(" ")
        : error.message || "Error inesperado al enviar solicitud de vacaciones.",
    };
  }
}

export async function updateVacationStatusAction(
  id: string,
  status: "approved" | "rejected"
): Promise<ActionState> {
  try {
    const { user } = await requireAuthenticatedContext();
    const adminSupabase = getAdminClient();

    if (user.role !== "admin" && user.role !== "rrhh") {
      throw new Error("No tienes permisos para realizar esta acción.");
    }

    await updateVacationRequestStatus(adminSupabase, user.tenantId, id, status, user.id);

    revalidatePath("/rrhh/portal");

    return {
      status: "success",
      message: `Solicitud de vacaciones ${status === "approved" ? "aprobada" : "rechazada"} exitosamente.`,
    };
  } catch (error: any) {
    console.error("[updateVacationStatusAction Error]:", error);
    return {
      status: "error",
      message: error.message || "Error inesperado al procesar solicitud.",
    };
  }
}
