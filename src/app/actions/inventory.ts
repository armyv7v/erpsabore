"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/types/erp";
import { requireAuthenticatedContext, assertUserHasRole } from "@/lib/services/auth-service";
import { insertProduct, getProductById, updateProduct } from "@/lib/repositories/product-repository";
import { uploadProductImage, deleteProductImage } from "@/lib/services/storage-service";
import { getProductCategory, PRODUCT_CATEGORIES } from "@/lib/utils/barcode-generator";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateImageFile(file: File | null): string | null {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_SIZE) return "La imagen no debe superar los 2MB.";
  if (!ALLOWED_MIME_TYPES.includes(file.type)) return "Tipo de imagen no permitido (solo JPG, PNG, WEBP, GIF).";
  return null;
}

function calculateEan13(base12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base12[i], 10);
    sum += (i % 2 === 0) ? digit * 1 : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${base12}${checkDigit}`;
}

async function generateUniqueSku(supabase: SupabaseClient, tenantId: string, name: string): Promise<string> {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 18);

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const nextSeq = (count ?? 0) + 1;
  let finalSku = `INS-${String(nextSeq).padStart(4, "0")}-${normalized}`;
  
  let attempts = 0;
  while (attempts < 10) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("sku", finalSku)
      .maybeSingle();

    if (!data) break;
    attempts++;
    finalSku = `INS-${String(nextSeq + attempts).padStart(4, "0")}-${normalized}`;
  }
  return finalSku;
}

async function generateUniqueBarcode(supabase: SupabaseClient, tenantId: string, name: string): Promise<string> {
  const categoryName = getProductCategory(name);
  const category = PRODUCT_CATEGORIES.find(c => c.name === categoryName);
  const catId = category ? category.id : "12";
  const prefix = `780123${catId}`;

  const { data } = await supabase
    .from("products")
    .select("barcode")
    .eq("tenant_id", tenantId)
    .like("barcode", `${prefix}%`);

  let maxSeq = 0;
  if (data && data.length > 0) {
    for (const item of data) {
      if (item.barcode && item.barcode.length === 13) {
        const seqStr = item.barcode.slice(8, 12);
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const sequenceStr = String(nextSeq).padStart(4, "0");
  const base12 = `${prefix}${sequenceStr}`;
  return calculateEan13(base12);
}

const createProductSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  sku: z.string().optional().nullable().or(z.literal("")).nullable(),
  barcode: z.string().optional().nullable().or(z.literal("")).nullable(),
  unitPrice: z.number({ error: "El precio debe ser un número." }).min(0, "El precio no puede ser negativo."),
  stockQuantity: z.number({ error: "La cantidad debe ser un número." }).int().min(0, "La cantidad no puede ser negativa."),
  stockMinQuantity: z.number().int().min(0).optional().default(10),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
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
    let rawSku = String(formData.get("sku") ?? "").trim();
    if (!rawSku) {
      rawSku = await generateUniqueSku(supabase, user.tenantId, rawName);
    } else {
      rawSku = rawSku.toUpperCase();
    }

    let rawBarcode = formData.get("barcode") ? String(formData.get("barcode")).trim() : null;
    if (!rawBarcode || rawBarcode === "") {
      rawBarcode = await generateUniqueBarcode(supabase, user.tenantId, rawName);
    }

    const rawPrice = Number(formData.get("unitPrice") ?? 0);
    const rawQty = Number(formData.get("stockQuantity") ?? 0);
    const rawMinQty = Number(formData.get("stockMinQuantity") ?? 10);
    const rawDescription = formData.get("description")
      ? String(formData.get("description")).trim()
      : null;

    const imageFile = formData.get("image") as File | null;
    const validationError = validateImageFile(imageFile);
    if (validationError) {
      return { status: "error", message: validationError };
    }

    const input = createProductSchema.parse({
      name: rawName,
      sku: rawSku,
      barcode: rawBarcode,
      unitPrice: rawPrice,
      stockQuantity: rawQty,
      stockMinQuantity: rawMinQty,
      description: rawDescription,
      imageUrl: null,
    });

    // 1. Crear producto base
    const product = await insertProduct(supabase, user.tenantId, {
      ...input,
      sku: rawSku, // Ensure non-empty string is passed since repository schema expects string
      barcode: rawBarcode,
    });

    // 2. Si se seleccionó una imagen, subirla y actualizar la URL
    if (imageFile && imageFile.size > 0) {
      try {
        const imageUrl = await uploadProductImage(user.tenantId, product.id, imageFile);
        await updateProduct(supabase, user.tenantId, product.id, {
          ...input,
          sku: rawSku,
          imageUrl,
        });
      } catch (uploadError) {
        console.error("[createProductAction] Error al subir imagen:", uploadError);
        // Continuamos de todas formas ya que el producto fue creado, pero notificamos al usuario.
        return {
          status: "success",
          message: "Producto creado, pero ocurrió un problema al subir la imagen.",
        };
      }
    }

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
  barcode: z.string().optional().nullable().or(z.literal("")).nullable(),
  unitPrice: z.number({ error: "El precio debe ser un número." }).min(0, "El precio no puede ser negativo."),
  stockMinQuantity: z.number().int().min(0).optional().default(10),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
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

    const currentProduct = await getProductById(supabase, user.tenantId, productId);
    if (!currentProduct) {
      return { status: "error", message: "El producto no existe." };
    }

    const rawName = String(formData.get("name") ?? "").trim();
    const rawSku = String(formData.get("sku") ?? "").trim();
    const rawBarcode = formData.get("barcode") ? String(formData.get("barcode")).trim() : null;
    const rawPrice = Number(formData.get("unitPrice") ?? 0);
    const rawMinQty = Number(formData.get("stockMinQuantity") ?? 10);
    const rawDescription = formData.get("description")
      ? String(formData.get("description")).trim()
      : null;
    
    // Capturar stockQuantity si se suministra en el formulario
    const hasStockField = formData.has("stockQuantity");
    const rawQty = hasStockField ? Number(formData.get("stockQuantity")) : null;

    const imageFile = formData.get("image") as File | null;
    const removeImage = formData.get("removeImage") === "true";

    const validationError = validateImageFile(imageFile);
    if (validationError) {
      return { status: "error", message: validationError };
    }

    let finalImageUrl = currentProduct.imageUrl;

    // Si se subió un nuevo archivo o se marcó para eliminar
    if (removeImage || (imageFile && imageFile.size > 0)) {
      // Eliminar imagen anterior en storage
      if (currentProduct.imageUrl) {
        try {
          await deleteProductImage(currentProduct.imageUrl);
        } catch (deleteError) {
          console.error("[updateProductAction] Error al borrar imagen anterior:", deleteError);
        }
      }
      finalImageUrl = null;
    }

    // Subir nueva imagen si se suministró
    if (imageFile && imageFile.size > 0) {
      try {
        finalImageUrl = await uploadProductImage(user.tenantId, productId, imageFile);
      } catch (uploadError) {
        console.error("[updateProductAction] Error al subir nueva imagen:", uploadError);
        return {
          status: "error",
          message: "Ocurrió un problema al subir la nueva imagen del producto.",
        };
      }
    }

    const input = updateProductSchema.parse({
      name: rawName,
      sku: rawSku,
      barcode: rawBarcode,
      unitPrice: rawPrice,
      stockMinQuantity: rawMinQty,
      description: rawDescription,
      imageUrl: finalImageUrl,
    });

    // 1. Actualizar datos base del producto
    await updateProduct(supabase, user.tenantId, productId, input);

    // 2. Si se editó la cantidad de stock y es diferente de la actual, la actualizamos
    if (rawQty !== null && rawQty !== currentProduct.stockQuantity) {
      if (!Number.isInteger(rawQty) || rawQty < 0) {
        return { status: "error", message: "La cantidad de stock debe ser un entero no negativo." };
      }
      const { updateProductStock } = await import("@/lib/repositories/product-repository");
      await updateProductStock(supabase, user.tenantId, productId, rawQty);
    }

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

