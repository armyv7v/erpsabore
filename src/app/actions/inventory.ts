"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/types/erp";
import { requireAuthenticatedContext, assertUserHasRole } from "@/lib/services/auth-service";
import { insertProduct } from "@/lib/repositories/product-repository";

const createProductSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  sku: z.string().min(1, "El SKU es obligatorio.").toUpperCase(),
  unitPrice: z.number({ error: "El precio debe ser un número." }).min(0, "El precio no puede ser negativo."),
  stockQuantity: z.number({ error: "La cantidad debe ser un número." }).int().min(0, "La cantidad no puede ser negativa."),
  stockMinQuantity: z.number().int().min(0).optional().default(10),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    const messages = error.issues.map((i) => i.message).filter((m, i, arr) => arr.indexOf(m) === i);
    return messages.length > 0 ? messages.join(" ") : fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    assertUserHasRole(user, ["admin", "bodega"]);

    const rawName = String(formData.get("name") ?? "").trim();
    const rawSku = String(formData.get("sku") ?? "").trim();
    const rawPrice = Number(formData.get("unitPrice") ?? 0);
    const rawQty = Number(formData.get("stockQuantity") ?? 0);
    const rawMinQty = Number(formData.get("stockMinQuantity") ?? 10);
    const rawDescription = formData.get("description")
      ? String(formData.get("description")).trim()
      : null;

    const input = createProductSchema.parse({
      name: rawName,
      sku: rawSku,
      unitPrice: rawPrice,
      stockQuantity: rawQty,
      stockMinQuantity: rawMinQty,
      description: rawDescription,
      imageUrl: null,
    });

    await insertProduct(supabase, user.tenantId, input);

    revalidatePath("/inventario");

    return { status: "success", message: "Producto creado exitosamente." };
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "No se pudo crear el producto."),
    };
  }
}

export async function updateProductStockAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    assertUserHasRole(user, ["admin", "bodega"]);

    const productId = String(formData.get("productId") ?? "").trim();
    const quantity = Number(formData.get("stockQuantity") ?? -1);

    if (!productId) return { status: "error", message: "ID de producto inválido." };
    if (!Number.isInteger(quantity) || quantity < 0)
      return { status: "error", message: "La cantidad debe ser un entero no negativo." };

    const { updateProductStock } = await import("@/lib/repositories/product-repository");
    await updateProductStock(supabase, user.tenantId, productId, quantity);

    revalidatePath("/inventario");

    return { status: "success", message: "Stock actualizado correctamente." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo actualizar el stock.",
    };
  }
}

const updateProductSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  sku: z.string().min(1, "El SKU es obligatorio.").toUpperCase(),
  unitPrice: z.number({ error: "El precio debe ser un número." }).min(0, "El precio no puede ser negativo."),
  stockMinQuantity: z.number().int().min(0).optional().default(10),
  description: z.string().optional().nullable(),
});

export async function updateProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    assertUserHasRole(user, ["admin", "bodega"]);

    const productId = String(formData.get("productId") ?? "").trim();
    if (!productId) return { status: "error", message: "ID de producto inválido." };

    const rawName = String(formData.get("name") ?? "").trim();
    const rawSku = String(formData.get("sku") ?? "").trim();
    const rawPrice = Number(formData.get("unitPrice") ?? 0);
    const rawMinQty = Number(formData.get("stockMinQuantity") ?? 10);
    const rawDescription = formData.get("description")
      ? String(formData.get("description")).trim()
      : null;

    const input = updateProductSchema.parse({
      name: rawName,
      sku: rawSku,
      unitPrice: rawPrice,
      stockMinQuantity: rawMinQty,
      description: rawDescription,
    });

    const { updateProduct } = await import("@/lib/repositories/product-repository");
    await updateProduct(supabase, user.tenantId, productId, input);

    revalidatePath("/inventario");

    return { status: "success", message: "Producto actualizado exitosamente." };
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "No se pudo actualizar el producto."),
    };
  }
}

export async function deleteProductAction(
  productId: string,
): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    assertUserHasRole(user, ["admin", "bodega"]);

    if (!productId) return { status: "error", message: "ID de producto inválido." };

    const { deleteProduct } = await import("@/lib/repositories/product-repository");
    await deleteProduct(supabase, user.tenantId, productId);

    revalidatePath("/inventario");

    return { status: "success", message: "Producto eliminado exitosamente." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo eliminar el producto.",
    };
  }
}

