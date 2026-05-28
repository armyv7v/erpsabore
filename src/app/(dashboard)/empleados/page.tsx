import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { listEmployees } from "@/lib/repositories/employee-repository";
import { isSupabaseConfigured, getSupabaseAdminEnv } from "@/lib/supabase/config";
import { mockEmployees } from "@/data/employees";
import { createClient } from "@supabase/supabase-js";
import EmployeesClient from "./employees-client";

async function getEmployees() {
  if (!isSupabaseConfigured()) {
    return mockEmployees.map((e) => ({
      id: e.id,
      tenantId: "mock",
      fullName: e.name,
      roleName: e.role,
      department: e.department,
      email: null,
      status: e.status as "active" | "vacation" | "license" | "inactive",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  const user = await requireAuthenticatedUser();
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  const adminSupabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return listEmployees(adminSupabase, user.tenantId);
}

export default async function EmployeesPage() {
  const employees = await getEmployees();
  return <EmployeesClient employees={employees} />;
}
