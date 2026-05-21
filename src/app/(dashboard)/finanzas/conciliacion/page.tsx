import React from "react";
import ReconciliationWorkspace from "@/components/erp/ReconciliationWorkspace";
import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { getFinanceMetrics, getReconciliationWorkspace } from "@/lib/services/metrics-service";

export default async function ReconciliationPage() {
  const user = await requireAuthenticatedUser();
  const { reconciliation } = await getFinanceMetrics(user);
  const { bankRows, erpRows, persistent } = await getReconciliationWorkspace(user);

  return (
    <ReconciliationWorkspace
      statementBalance={reconciliation.statementBalance}
      erpBalance={reconciliation.erpBalance}
      initialBankRows={bankRows}
      initialErpRows={erpRows}
      persistentMode={persistent}
    />
  );
}
