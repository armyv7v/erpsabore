import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerRecord } from "@/lib/types/erp";

interface CustomerRow {
  id: string;
  tenant_id: string;
  name: string;
  rut: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeRut(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function mapCustomer(row: CustomerRow): CustomerRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    rut: row.rut,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCustomers(supabase: SupabaseClient, tenantId: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("id, tenant_id, name, rut, email, phone, notes, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("No se pudieron cargar los clientes.");
  }

  return ((data ?? []) as CustomerRow[]).map(mapCustomer);
}

export async function findCustomerByRut(
  supabase: SupabaseClient,
  tenantId: string,
  rut: string,
) {
  const normalizedRut = normalizeRut(rut);
  const { data, error } = await supabase
    .from("customers")
    .select("id, tenant_id, name, rut, email, phone, notes, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .eq("rut", normalizedRut)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo consultar el cliente. ${error.message}`);
  }

  return data ? mapCustomer(data as CustomerRow) : null;
}

export async function createCustomer(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    name: string;
    rut: string;
    email?: string | null;
    phone?: string | null;
    createdBy: string;
  },
) {
  const normalizedRut = normalizeRut(input.rut);
  const { data, error } = await supabase
    .from("customers")
    .insert({
      tenant_id: input.tenantId,
      name: input.name.trim(),
      rut: normalizedRut,
      email: input.email ?? null,
      phone: input.phone ?? null,
      created_by: input.createdBy,
    })
    .select("id, tenant_id, name, rut, email, phone, notes, created_at, updated_at")
    .single();

  if (error?.code === "23505") {
    const existingCustomer = await findCustomerByRut(supabase, input.tenantId, normalizedRut);

    if (existingCustomer) {
      return existingCustomer;
    }
  }

  if (error || !data) {
    throw new Error(`No se pudo crear el cliente. ${error ? error.message : ""}`.trim());
  }

  return mapCustomer(data as CustomerRow);
}
