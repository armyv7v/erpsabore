import BillingWorkspace from "@/components/erp/BillingWorkspace";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { getBillingWorkspace } from "@/lib/services/invoice-service";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 10);

  const { user, supabase } = await requireAuthenticatedContext();
  const workspace = await getBillingWorkspace(user, { page, pageSize }, supabase);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <BillingWorkspace
      invoices={workspace.invoices}
      totals={workspace.totals}
      today={today}
      page={workspace.page}
      pageSize={workspace.pageSize}
      totalCount={workspace.totalCount}
      pageCount={workspace.pageCount}
      activeCertificate={workspace.activeCertificate}
    />
  );
}
