export const dynamic = "force-dynamic";

import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { listEmployees } from "@/lib/repositories/employee-repository";
import { isSupabaseConfigured, getSupabaseAdminEnv } from "@/lib/supabase/config";
import { createClient } from "@supabase/supabase-js";
import NominaClient from "./nomina-client";
 
async function getEmployees() {
  if (!isSupabaseConfigured()) {
    // Si no está configurado Supabase (desarrollo local), retornamos array vacío
    // para cumplir con el requerimiento de dejar todo en cero de manera inicial.
    return [];
  }
 
  try {
    const user = await requireAuthenticatedUser();
    const { url, serviceRoleKey } = getSupabaseAdminEnv();
    const adminSupabase = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    return await listEmployees(adminSupabase, user.tenantId);
  } catch (error) {
    console.error("Error cargando empleados para la nómina:", error);
    return [];
  }
}
 
export default async function PayrollPage() {
  const employees = await getEmployees();
  return <NominaClient initialEmployees={employees} />;
}
