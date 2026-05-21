import CRMWorkspace from "@/components/erp/CRMWorkspace";
import { getFallbackCustomers } from "@/lib/mock/fallback-data";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listCustomers } from "@/lib/repositories/customer-repository";
import { listOpportunities } from "@/lib/repositories/crm-repository";

export const dynamic = "force-dynamic";

export default async function CRMPage() {
  const { user, supabase } = await requireAuthenticatedContext();

  if (!isSupabaseConfigured()) {
    return <CRMWorkspace customers={getFallbackCustomers()} opportunities={[]} />;
  }

  const [customers, opportunities] = await Promise.all([
    listCustomers(supabase, user.tenantId),
    listOpportunities(supabase, user.tenantId).catch(() => []),
  ]);

  return <CRMWorkspace customers={customers} opportunities={opportunities} />;
}
