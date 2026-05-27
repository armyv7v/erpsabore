import React from "react";
import SalesWorkspace from "@/components/erp/SalesWorkspace";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { getSalesWorkspace } from "@/lib/services/invoice-service";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 10);

  const { user, supabase } = await requireAuthenticatedContext();

  let workspace: Awaited<ReturnType<typeof getSalesWorkspace>>;
  try {
    workspace = await getSalesWorkspace(user, { page, pageSize }, supabase);
  } catch {
    workspace = {
      invoices: [],
      customers: [],
      summary: { totalPaid: 0, totalPending: 0, totalOverdue: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 },
      totals: { totalIssued: 0, totalOutstanding: 0, draftCount: 0, issuedCount: 0 },
      totalCount: 0,
      page,
      pageSize,
      pageCount: 0,
    };
  }

  return (
    <SalesWorkspace
      invoices={workspace.invoices}
      customers={workspace.customers}
      summary={workspace.summary}
      draftStorageKey={`erpSabore:draftInvoice:${user.tenantId}:${user.id}`}
      page={workspace.page}
      pageSize={workspace.pageSize}
      totalCount={workspace.totalCount}
      pageCount={workspace.pageCount}
    />
  );
}
