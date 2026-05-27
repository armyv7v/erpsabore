"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { createBranch } from "@/lib/repositories/branch-repository";
import type { ActionState } from "@/lib/types/erp";

const branchSchema = z.object({
  name: z.string().min(3, "El nombre de la sucursal debe tener al menos 3 caracteres."),
  address: z.string().optional().nullable().or(z.literal("")),
  city: z.string().optional().nullable().or(z.literal("")),
  region: z.string().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable().or(z.literal("")),
  email: z.string().email("El correo electrónico no es válido.").optional().nullable().or(z.literal("")).nullable(),
  manager: z.string().optional().nullable().or(z.literal("")),
  status: z.enum(["active", "inactive", "maintenance"]).default("active"),
});

export async function createBranchAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState & { branch?: any }> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();

    const rawData = {
      name: String(formData.get("name") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      region: String(formData.get("region") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      manager: String(formData.get("manager") ?? "").trim() || null,
      status: (formData.get("status") ?? "active") as any,
    };

    const parsed = branchSchema.parse(rawData);

    const branch = await createBranch(supabase, user.tenantId, parsed);

    try {
      revalidatePath("/sucursales");
      revalidatePath("/pos");
    } catch (e) {}

    return {
      status: "success",
      message: `La sucursal "${branch.name}" se creó con éxito.`,
      branch,
    };
  } catch (error: any) {
    console.error("[createBranchAction Error]:", error);
    return {
      status: "error",
      message: error instanceof z.ZodError 
        ? error.issues.map((e) => e.message).join(" ") 
        : error.message || "Error inesperado al crear la sucursal.",
    };
  }
}
