import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";
import { listBranches } from "@/lib/repositories/branch-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockBranches } from "@/data/branches";
import BranchesClient from "./branches-client";

function mockToRecord(b: typeof mockBranches[number]) {
  return {
    id: b.id,
    tenantId: "mock",
    name: b.name,
    address: b.address,
    city: null as string | null,
    region: null as string | null,
    phone: null as string | null,
    email: null as string | null,
    manager: null as string | null,
    status: "active" as const,
    employeesCount: b.employeesCount,
    shipmentsActive: 0,
    createdAt: new Date().toISOString(),
  };
}

async function getBranches() {
  if (!isSupabaseConfigured()) {
    return mockBranches.map(mockToRecord);
  }
  const user = await requireAuthenticatedUser();
  const supabase = await createAuthenticatedSupabaseClient();
  return listBranches(supabase, user.tenantId);
}

export default async function BranchesPage() {
  const branches = await getBranches();
  return <BranchesClient branches={branches} />;
}
