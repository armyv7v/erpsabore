import type { SupabaseClient } from "@supabase/supabase-js";

export interface DigitalCertificateRecord {
  id?: string;
  tenantId: string;
  rutFirmante: string;
  subjectName: string;
  validUntil: string;
  certificateData: string; // JSON string conteniendo el sobre criptográfico
}

interface CertificateRow {
  id: string;
  tenant_id: string;
  rut_firmante: string;
  subject_name: string;
  valid_until: string;
  certificate_data: string;
  created_at: string;
  updated_at: string;
}

/**
 * Recupera el certificado digital activo de un tenant.
 */
export async function getActiveCertificate(
  supabase: SupabaseClient,
  tenantId: string
): Promise<DigitalCertificateRecord | null> {
  const { data, error } = await supabase
    .from("tenant_digital_certificates")
    .select("id, tenant_id, rut_firmante, subject_name, valid_until, certificate_data")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar el certificado digital. Detalle: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as CertificateRow;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    rutFirmante: row.rut_firmante,
    subjectName: row.subject_name,
    validUntil: row.valid_until,
    certificateData: row.certificate_data,
  };
}

/**
 * Guarda o actualiza el certificado digital de un tenant (aplica upsert por clave única tenant_id, rut_firmante).
 */
export async function saveDigitalCertificate(
  supabase: SupabaseClient,
  input: Omit<DigitalCertificateRecord, "id">
): Promise<void> {
  const { error } = await supabase
    .from("tenant_digital_certificates")
    .upsert(
      {
        tenant_id: input.tenantId,
        rut_firmante: input.rutFirmante,
        subject_name: input.subjectName,
        valid_until: input.validUntil,
        certificate_data: input.certificateData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "tenant_id,rut_firmante",
      }
    );

  if (error) {
    throw new Error(`No se pudo guardar el certificado digital. Detalle: ${error.message}`);
  }
}

/**
 * Elimina el certificado digital de un tenant.
 */
export async function deleteActiveCertificate(
  supabase: SupabaseClient,
  tenantId: string
): Promise<void> {
  const { error } = await supabase
    .from("tenant_digital_certificates")
    .delete()
    .eq("tenant_id", tenantId);

  if (error) {
    throw new Error(`No se pudo revocar el certificado digital. Detalle: ${error.message}`);
  }
}
