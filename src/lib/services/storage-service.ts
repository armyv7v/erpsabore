import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Asegura que el bucket de almacenamiento público 'product-images' exista.
 * Utiliza el cliente de administración para saltarse restricciones de RLS durante
 * el inicio y garantizar que el bucket esté disponible.
 */
export async function ensureProductBucketExists(): Promise<void> {
  const adminClient = createSupabaseAdminClient();

  const { data: buckets, error: listError } = await adminClient.storage.listBuckets();
  if (listError) {
    console.error("[Storage] Error al listar buckets:", listError);
    return;
  }

  const hasBucket = buckets?.some((b) => b.name === "product-images");
  if (!hasBucket) {
    const { error: createError } = await adminClient.storage.createBucket("product-images", {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      fileSizeLimit: 2 * 1024 * 1024, // 2MB
    });

    if (createError) {
      console.error("[Storage] Error al crear bucket 'product-images':", createError);
    } else {
      console.log("[Storage] Bucket público 'product-images' creado con éxito.");
    }
  }
}

/**
 * Sube una imagen al bucket de Supabase Storage.
 * Retorna la URL pública de la imagen.
 */
export async function uploadProductImage(
  tenantId: string,
  productId: string,
  file: File,
): Promise<string> {
  // Aseguramos existencia del bucket antes de subir
  await ensureProductBucketExists();

  const adminClient = createSupabaseAdminClient();

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${tenantId}/${productId}-${Date.now()}.${fileExt}`;

  // Convertimos File a Buffer para subirlo de forma robusta en el entorno de Node.js (Server Actions)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await adminClient.storage
    .from("product-images")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`No se pudo subir la foto del producto. Detalle: ${error.message}`);
  }

  const { data: urlData } = adminClient.storage
    .from("product-images")
    .getPublicUrl(fileName);

  if (!urlData || !urlData.publicUrl) {
    throw new Error("No se pudo obtener la URL pública de la foto del producto.");
  }

  return urlData.publicUrl;
}

/**
 * Elimina una imagen de Supabase Storage partiendo de su URL pública.
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.includes("product-images")) {
    return;
  }

  const adminClient = createSupabaseAdminClient();

  // Extraemos la ruta relativa {tenantId}/{filename} desde la URL pública
  // Estructura URL habitual: https://.../storage/v1/object/public/product-images/{tenantId}/{fileName}
  const parts = imageUrl.split("/product-images/");
  if (parts.length < 2) {
    return;
  }

  const relativePath = parts[1];

  const { error } = await adminClient.storage
    .from("product-images")
    .remove([relativePath]);

  if (error) {
    console.error(`[Storage] Error al borrar imagen obsoleta del bucket: ${error.message}`);
  } else {
    console.log(`[Storage] Imagen obsoleta borrada con éxito: ${relativePath}`);
  }
}
