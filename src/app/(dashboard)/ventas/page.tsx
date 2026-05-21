import React from "react";
import SalesWorkspace from "@/components/erp/SalesWorkspace";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { getSalesWorkspace } from "@/lib/services/invoice-service";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 10);

  const { user, supabase } = await requireAuthenticatedContext();
  const workspace = await getSalesWorkspace(user, { page, pageSize }, supabase);

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
