import type { SupabaseClient } from "@supabase/supabase-js";

export type EmployeeStatus = "active" | "vacation" | "license" | "inactive";

export interface EmployeeRecord {
  id: string;
  tenantId: string;
  fullName: string;
  roleName: string;
  department: string;
  email: string | null;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeRow {
  id: string;
  tenant_id: string;
  full_name: string;
  role_name: string;
  department: string;
  email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapEmployee(row: EmployeeRow): EmployeeRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    fullName: row.full_name,
    roleName: row.role_name,
    department: row.department,
    email: row.email,
    status: (row.status ?? "active") as EmployeeStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const EMPLOYEE_SELECT =
  "id, tenant_id, full_name, role_name, department, email, status, created_at, updated_at";

export async function listEmployees(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<EmployeeRecord[]> {
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_SELECT)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar los empleados. ${error.message}`.trim());
  }

  return ((data ?? []) as EmployeeRow[]).map(mapEmployee);
}

export async function createEmployee(
  supabase: SupabaseClient,
  tenantId: string,
  input: {
    fullName: string;
    roleName: string;
    department: string;
    email?: string | null;
    status: EmployeeStatus;
  }
): Promise<EmployeeRecord> {
  const { data, error } = await supabase
    .from("employees")
    .insert({
      tenant_id: tenantId,
      full_name: input.fullName,
      role_name: input.roleName,
      department: input.department,
      email: input.email || null,
      status: input.status,
    })
    .select(EMPLOYEE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear el empleado. ${error ? error.message : "Error desconocido"}`.trim());
  }

  return mapEmployee(data as EmployeeRow);
}
