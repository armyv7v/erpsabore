import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";
import { listSuppliers } from "@/lib/repositories/supplier-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockSuppliers } from "@/data/suppliers";
import SuppliersClient from "./suppliers-client";

async function getSuppliers() {
  if (!isSupabaseConfigured()) {
    return mockSuppliers.map((s) => ({
      id: s.id,
      tenantId: "mock",
      name: s.name,
      rut: s.rut,
      category: s.category,
      email: null,
      phone: null,
      pendingBalance: s.pendingBalance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  const user = await requireAuthenticatedUser();
  const supabase = await createAuthenticatedSupabaseClient();
  return listSuppliers(supabase, user.tenantId);
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  return <SuppliersClient suppliers={suppliers} />;
}