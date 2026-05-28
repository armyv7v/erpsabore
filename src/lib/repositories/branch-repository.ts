import type { SupabaseClient } from "@supabase/supabase-js";

export interface BranchRecord {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
  phone: string | null;
  email: string | null;
  manager: string | null;
  status: "active" | "inactive" | "maintenance";
  // KPIs calculados via joins
  employeesCount: number;
  shipmentsActive: number;
  createdAt: string;
}

interface BranchRow {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
  phone: string | null;
  email: string | null;
  manager: string | null;
  status: string;
  created_at: string;
}

function mapBranch(row: BranchRow): BranchRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    address: row.address,
    city: row.city,
    region: row.region,
    phone: row.phone,
    email: row.email,
    manager: row.manager,
    status: (row.status ?? "active") as BranchRecord["status"],
    employeesCount: 0,
    shipmentsActive: 0,
    createdAt: row.created_at,
  };
}

const BRANCH_SELECT =
  "id, tenant_id, name, address, city, region, phone, email, manager, status, created_at";

export async function listBranches(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<BranchRecord[]> {
  const { data, error } = await supabase
    .from("branches")
    .select(BRANCH_SELECT)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar las sucursales. ${error.message}`.trim());
  }

  return ((data ?? []) as BranchRow[]).map(mapBranch);
}

export async function createBranch(
  supabase: SupabaseClient,
  tenantId: string,
  input: {
    name: string;
    address?: string | null;
    city?: string | null;
    region?: string | null;
    phone?: string | null;
    email?: string | null;
    manager?: string | null;
    status: "active" | "inactive" | "maintenance";
  }
): Promise<BranchRecord> {
  const { data, error } = await supabase
    .from("branches")
    .insert({
      tenant_id: tenantId,
      name: input.name,
      address: input.address || null,
      city: input.city || null,
      region: input.region || null,
      phone: input.phone || null,
      email: input.email || null,
      manager: input.manager || null,
      status: input.status,
    })
    .select(BRANCH_SELECT)
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear la sucursal. ${error ? error.message : "Error desconocido"}`.trim());
  }

  return mapBranch(data as BranchRow);
}

export async function updateBranch(
  supabase: SupabaseClient,
  tenantId: string,
  branchId: string,
  input: {
    name?: string;
    address?: string | null;
    city?: string | null;
    region?: string | null;
    phone?: string | null;
    email?: string | null;
    manager?: string | null;
    status?: "active" | "inactive" | "maintenance";
  }
): Promise<BranchRecord> {
  const { data, error } = await supabase
    .from("branches")
    .update({
      name: input.name,
      address: input.address,
      city: input.city,
      region: input.region,
      phone: input.phone,
      email: input.email,
      manager: input.manager,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", branchId)
    .select(BRANCH_SELECT)
    .single();

  if (error || !data) {
    throw new Error(`No se pudo actualizar la sucursal. ${error ? error.message : "Error desconocido"}`.trim());
  }

  return mapBranch(data as BranchRow);
}
