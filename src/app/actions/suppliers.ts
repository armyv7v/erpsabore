"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/types/erp";
import { requireAuthenticatedContext, assertUserHasRole } from "@/lib/services/auth-service";
import { insertSupplier } from "@/lib/repositories/supplier-repository";

const createSupplierSchema = z.object({
  name: z.string().min(2, "El nombre o razón social debe tener al menos 2 caracteres."),
  rut: z.string().min(1, "El RUT es obligatorio."),
  category: z.string().optional().nullable(),
  email: z.string().email("El formato del email es inválido.").optional().or(z.literal("")),
  phone: z.string().optional().nullable(),
});

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    const messages = error.issues.map((i) => i.message).filter((m, i, arr) => arr.indexOf(m) === i);
    return messages.length > 0 ? messages.join(" ") : fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function createSupplierAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    assertUserHasRole(user, ["admin", "finanzas", "bodega"]);

    const rawName = String(formData.get("name") ?? "").trim();
    const rawRut = String(formData.get("rut") ?? "").trim();
    const rawCategory = formData.get("category") ? String(formData.get("category")).trim() : null;
    const rawEmail = String(formData.get("email") ?? "").trim();
    const rawPhone = formData.get("phone") ? String(formData.get("phone")).trim() : null;

    const input = createSupplierSchema.parse({
      name: rawName,
      rut: rawRut,
      category: rawCategory,
      email: rawEmail === "" ? null : rawEmail,
      phone: rawPhone === "" ? null : rawPhone,
    });

    await insertSupplier(supabase, user.tenantId, input);

    revalidatePath("/proveedores");

    return { status: "success", message: "Proveedor creado exitosamente." };
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "No se pudo crear el proveedor."),
    };
  }
}
