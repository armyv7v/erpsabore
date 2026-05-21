import QuotesWorkspace from "@/components/erp/QuotesWorkspace";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { listQuotes } from "@/lib/repositories/quote-repository";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const { user, supabase } = await requireAuthenticatedContext();
  const quotes = await listQuotes(supabase, user.tenantId);

  return <QuotesWorkspace quotes={quotes} />;
}
