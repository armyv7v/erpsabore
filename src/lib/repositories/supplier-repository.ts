import type { SupabaseClient } from "@supabase/supabase-js";

export interface SupplierRecord {
  id: string;
  tenantId: string;
  name: string;
  rut: string;
  category: string | null;
  email: string | null;
  phone: string | null;
  pendingBalance: number;
  createdAt: string;
  updatedAt: string;
}

interface SupplierRow {
  id: string;
  tenant_id: string;
  name: string;
  rut: string;
  category: string | null;
  email: string | null;
  phone: string | null;
  pending_balance: number | string;
  created_at: string;
  updated_at: string;
}

function numeric(value: number | string): number {
  return typeof value === "string" ? parseFloat(value) : value;
}

function mapSupplier(row: SupplierRow): SupplierRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    rut: row.rut,
    category: row.category,
    email: row.email,
    phone: row.phone,
    pendingBalance: numeric(row.pending_balance),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SUPPLIER_SELECT =
  "id, tenant_id, name, rut, category, email, phone, pending_balance, created_at, updated_at";

export async function listSuppliers(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<SupplierRecord[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select(SUPPLIER_SELECT)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar los proveedores. ${error.message}`.trim());
  }

  return ((data ?? []) as SupplierRow[]).map(mapSupplier);
}

export async function getTotalCommittedPayments(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("pending_balance")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .gt("pending_balance", 0);

  if (error) {
    throw new Error(`No se pudo calcular los pagos comprometidos. ${error.message}`.trim());
  }

  return ((data ?? []) as Pick<SupplierRow, "pending_balance">[]).reduce(
    (sum, row) => sum + numeric(row.pending_balance),
    0,
  );
}
