"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { parseDigitalCertificate } from "@/lib/services/cert-parser";
import { encryptPrivateKey } from "@/lib/services/crypto-service";
import { saveDigitalCertificate, deleteActiveCertificate } from "@/lib/repositories/certificate-repository";
import type { ActionState } from "@/lib/types/erp";

/**
 * Server Action para recibir un certificado PFX/P12, desencriptarlo,
 * encriptar su clave privada usando AES-256-GCM y guardarlo en Supabase.
 */
export async function uploadDigitalCertificateAction(
  formData: FormData
): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    
    const file = formData.get("certificateFile") as File | null;
    const password = String(formData.get("password") ?? "");
    
    if (!file || file.size === 0) {
      throw new Error("No se seleccionó ningún archivo de certificado válido.");
    }
    
    // 1. Leer el archivo a Buffer de Node.js
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 2. Parsear el archivo PKCS#12 (.pfx / .p12)
    const parsed = parseDigitalCertificate(buffer, password);
    
    // 3. Encriptar la clave privada PEM de forma segura en AES-256-GCM
    const encrypted = encryptPrivateKey(parsed.privateKeyPem);
    
    // 4. Formatear el JSON para la columna certificate_data
    const certificateDataJson = JSON.stringify({
      encryptedPrivateKey: encrypted.encryptedPrivateKey,
      certificatePem: parsed.certificatePem,
      iv: encrypted.iv,
      tag: encrypted.tag,
    });
    
    // 5. Guardar en Supabase usando el repositorio de certificados
    await saveDigitalCertificate(supabase, {
      tenantId: user.tenantId,
      rutFirmante: parsed.rutFirmante,
      subjectName: parsed.subjectName,
      validUntil: parsed.validUntil,
      certificateData: certificateDataJson,
    });
    
    revalidatePath("/facturacion");
    
    return {
      status: "success",
      message: "¡Certificado Digital cargado, encriptado y guardado correctamente!",
    };
  } catch (err: any) {
    console.error("[dte-action] upload failed:", err);
    return {
      status: "error",
      message: err.message || "Fallo al subir o procesar el certificado digital.",
    };
  }
}

/**
 * Server Action para eliminar la firma digital del tenant activo de forma permanente.
 */
export async function deleteDigitalCertificateAction(): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    
    await deleteActiveCertificate(supabase, user.tenantId);
    
    revalidatePath("/facturacion");
    
    return {
      status: "success",
      message: "Firma Digital revocada e inhabilitada del sistema con éxito.",
    };
  } catch (err: any) {
    console.error("[dte-action] delete failed:", err);
    return {
      status: "error",
      message: err.message || "No se pudo inhabilitar la firma digital en el sistema.",
    };
  }
}
