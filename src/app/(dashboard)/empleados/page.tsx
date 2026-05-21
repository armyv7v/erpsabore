import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";
import { listEmployees } from "@/lib/repositories/employee-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockEmployees } from "@/data/employees";
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
  const supabase = await createAuthenticatedSupabaseClient();
  return listEmployees(supabase, user.tenantId);
}

export default async function EmployeesPage() {
  const employees = await getEmployees();
  return <EmployeesClient employees={employees} />;
}
