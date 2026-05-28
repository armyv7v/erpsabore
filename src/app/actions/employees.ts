"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { createEmployee } from "@/lib/repositories/employee-repository";
import type { ActionState } from "@/lib/types/erp";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "@/lib/supabase/config";

const employeeSchema = z.object({
  fullName: z.string().min(3, "El nombre completo debe tener al menos 3 caracteres."),
  roleName: z.string().min(2, "El cargo debe tener al menos 2 caracteres."),
  department: z.string().min(2, "El departamento debe ser seleccionado."),
  email: z.string().email("El correo electrónico no es válido.").optional().nullable().or(z.literal("")).nullable(),
  status: z.enum(["active", "vacation", "license", "inactive"]).default("active"),
});

export async function createEmployeeAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState & { employee?: any }> {
  try {
    const { user } = await requireAuthenticatedContext();

    const { url, serviceRoleKey } = getSupabaseAdminEnv();
    if (!url || !serviceRoleKey) {
      throw new Error("Supabase admin client is not configured properly in production.");
    }
    const adminSupabase = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const rawData = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      roleName: String(formData.get("roleName") ?? "").trim(),
      department: String(formData.get("department") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim() || null,
      status: (formData.get("status") ?? "active") as any,
    };

    const parsed = employeeSchema.parse(rawData);

    const employee = await createEmployee(adminSupabase, user.tenantId, parsed);

    try {
      revalidatePath("/empleados");
    } catch (e) {}

    return {
      status: "success",
      message: `El empleado "${employee.fullName}" fue contratado exitosamente.`,
      employee,
    };
  } catch (error: any) {
    console.error("[createEmployeeAction Error]:", error);
    return {
      status: "error",
      message: error instanceof z.ZodError 
        ? error.issues.map((e) => e.message).join(" ") 
        : error.message || "Error inesperado al registrar el empleado.",
    };
  }
}
