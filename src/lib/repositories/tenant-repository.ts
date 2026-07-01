import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantDetails } from "@/lib/types/erp";

// En memoria para el modo fallback sin Supabase
let localTenantDetails: TenantDetails = {
  id: "tenant-mock",
  name: "SABORÉ SPA",
  slug: "sabore-spa",
  rut: "77.947.538-7",
  razonSocial: "SABORÉ SPA",
  giro: "Venta al por menor de alimentos y almacenes",
  acteco: "472101",
  direccion: "Av. Providencia 1234, Oficina 501",
  comuna: "Providencia",
  ciudad: "Santiago",
  telefono: "+56 2 2345 6789",
  email: "contacto@sabore.cl",
};

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  rut: string | null;
  razon_social: string | null;
  giro: string | null;
  acteco: string | null;
  direccion: string | null;
  comuna: string | null;
  ciudad: string | null;
  telefono: string | null;
  email: string | null;
}

function mapTenant(row: TenantRow): TenantDetails {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    rut: row.rut || "77.947.538-7",
    razonSocial: row.razon_social || "SABORÉ SPA",
    giro: row.giro || "Venta al por menor de alimentos y almacenes",
    acteco: row.acteco || "472101",
    direccion: row.direccion || "Av. Providencia 1234, Oficina 501",
    comuna: row.comuna || "Providencia",
    ciudad: row.ciudad || "Santiago",
    telefono: row.telefono,
    email: row.email,
  };
}

const SELECT_FIELDS = "id, name, slug, rut, razon_social, giro, acteco, direccion, comuna, ciudad, telefono, email";

export async function getTenantDetails(
  supabase: SupabaseClient | null,
  tenantId: string
): Promise<TenantDetails> {
  if (!supabase) {
    return localTenantDetails;
  }

  const { data, error } = await supabase
    .from("tenants")
    .select(SELECT_FIELDS)
    .eq("id", tenantId)
    .single();

  if (error || !data) {
    throw new Error(`Error al recuperar configuración del tenant: ${error?.message || "No encontrado"}`);
  }

  return mapTenant(data as TenantRow);
}

export async function updateTenantDetails(
  supabase: SupabaseClient | null,
  tenantId: string,
  input: {
    rut: string;
    razonSocial: string;
    giro: string;
    acteco: string;
    direccion: string;
    comuna: string;
    ciudad: string;
    telefono?: string | null;
    email?: string | null;
  }
): Promise<TenantDetails> {
  if (!supabase) {
    localTenantDetails = {
      ...localTenantDetails,
      rut: input.rut,
      razonSocial: input.razonSocial,
      giro: input.giro,
      acteco: input.acteco,
      direccion: input.direccion,
      comuna: input.comuna,
      ciudad: input.ciudad,
      telefono: input.telefono || null,
      email: input.email || null,
    };
    return localTenantDetails;
  }

  const { data, error } = await supabase
    .from("tenants")
    .update({
      rut: input.rut,
      razon_social: input.razonSocial,
      giro: input.giro,
      acteco: input.acteco,
      direccion: input.direccion,
      comuna: input.comuna,
      ciudad: input.ciudad,
      telefono: input.telefono || null,
      email: input.email || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId)
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    throw new Error(`Error al actualizar configuración del tenant: ${error?.message || "Error desconocido"}`);
  }

  return mapTenant(data as TenantRow);
}
