import type { BankStatementRow, ERPMatchRow } from "@/data/reconciliation";
import { getFallbackFinanceMetrics, mockBankStatements, mockERPRecords } from "@/lib/mock/fallback-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AuthUser, DashboardMetrics, FinanceMetrics, InvoiceRecord } from "@/lib/types/erp";
import { getFinanceSourceData, getSalesWorkspace } from "@/lib/services/invoice-service";
import { getProductStockSummary } from "@/lib/repositories/product-repository";
import { createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";
import { getTotalCommittedPayments } from "@/lib/repositories/supplier-repository";

function isCommittedInvoice(invoice: InvoiceRecord) {
  return ["issued", "partially_paid", "paid", "overdue"].includes(invoice.status);
}

function ratio(part: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round(((part / total) * 100 + Number.EPSILON) * 10) / 10;
}

function formatSignedPercent(value: number) {
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10;
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

function latestInvoices(invoices: InvoiceRecord[]) {
  return [...invoices].slice(0, 3);
}

export async function getDashboardMetrics(user: AuthUser): Promise<DashboardMetrics> {
  const supabase = isSupabaseConfigured() ? await createAuthenticatedSupabaseClient() : null;

  const [workspace, stockSummary] = await Promise.all([
    getSalesWorkspace(user, { page: 1, pageSize: 10 }),
    supabase ? getProductStockSummary(supabase, user.tenantId) : Promise.resolve(null),
  ]);

  const invoices = workspace.invoices;
  const summary = workspace.summary;
  const totals = workspace.totals;
  const committedInvoices = invoices.filter(isCommittedInvoice);

  const currentTotal = totals.totalIssued;
  const pendingInvoicesCount = summary.pendingCount + summary.overdueCount;
  const paidTotal = summary.totalPaid;

  const estimatedCogs = Math.round(currentTotal * 0.42);
  const grossMarginPercentage = currentTotal > 0
    ? Math.round(((currentTotal - estimatedCogs) / currentTotal) * 100 * 10) / 10
    : 0;

  return {
    monthlySales: currentTotal,
    pendingInvoicesCount,
    grossMarginPercentage,
    stockAlertCount: stockSummary?.stockAlertCount ?? 0,
    revenueTrendTotal: currentTotal,
    revenueTrendGrowth: formatSignedPercent(
      ratio(
        paidTotal,
        Math.max(currentTotal, 1),
      ),
    ),
    latestInvoices: latestInvoices(committedInvoices),
  };
}

export async function getFinanceMetrics(user: AuthUser): Promise<FinanceMetrics> {
  if (!isSupabaseConfigured()) {
    return getFallbackFinanceMetrics();
  }

  const supabase = await createAuthenticatedSupabaseClient();
  const [{ totals, receivables, cashMovements, inventoryValue }, committedPayments] =
    await Promise.all([
      getFinanceSourceData(user, supabase),
      getTotalCommittedPayments(supabase, user.tenantId),
    ]);

  const confirmedMovements = cashMovements.filter((movement) => movement.status === "confirmed");
  const incomeMovements = confirmedMovements.filter((movement) => movement.kind === "income");
  const expenseMovements = confirmedMovements.filter((movement) => movement.kind === "expense");
  const matchedTransactions = cashMovements.filter((movement) => movement.status === "confirmed").length;
  const discrepancyTransactions = cashMovements.filter((movement) => movement.status === "reversed").length;
  const pendingTransactions = cashMovements.filter((movement) => movement.status === "pending").length;
  const totalTransactions = Math.max(cashMovements.length, 1);
  const monthlyIncome = incomeMovements.reduce((sum, movement) => sum + movement.amount, 0);
  const monthlyExpenses = expenseMovements.reduce((sum, movement) => sum + movement.amount, 0);
  const pendingReceivables = receivables.reduce((sum, receivable) => sum + receivable.balance, 0);
  const availableCash = monthlyIncome - monthlyExpenses;
  const projectedCash = availableCash + pendingReceivables - committedPayments;
  const totalRevenue = totals.totalIssued;
  const costOfSales = inventoryValue ? Math.round(inventoryValue * 0.05) : Math.round(totalRevenue * 0.42);
  const grossMarginAmount = totalRevenue - costOfSales;
  const operatingExpenses = monthlyExpenses;
  const netProfit = grossMarginAmount - operatingExpenses;
  const statementBalance = availableCash;
  const erpBalance = totalRevenue - pendingReceivables;

  return {
    cashFlow: {
      availableCash,
      monthlyIncome,
      monthlyExpenses,
      netFlow: availableCash,
      projectedCash,
      pendingReceivables,
      committedPayments,
      expenseDistribution: expenseMovements.map((movement) => ({
        category: movement.reference ?? "Egreso",
        amount: movement.amount,
        percentage: ratio(movement.amount, Math.max(monthlyExpenses, 1)),
      })),
      movements: cashMovements,
    },
    profitAndLoss: {
      totalRevenue,
      costOfSales,
      grossMarginAmount,
      grossMarginPercentage: ratio(grossMarginAmount, Math.max(totalRevenue, 1)),
      operatingExpenses,
      netProfit,
      netMarginPercentage: ratio(netProfit, Math.max(totalRevenue, 1)),
      roiPercentage: ratio(netProfit, Math.max(costOfSales + operatingExpenses, 1)),
    },
    reconciliation: {
      statementBalance,
      erpBalance,
      difference: erpBalance - statementBalance,
      matchedTransactions,
      discrepancyTransactions,
      pendingTransactions,
      totalTransactions,
      progressPercentage: ratio(matchedTransactions, totalTransactions),
    },
  };
}

function mapMovementToBankRow(movement: {
  id: string;
  movementDate: string;
  kind: "income" | "expense";
  amount: number;
  status: "pending" | "confirmed" | "reversed";
  reference: string | null;
  sourceType: string;
}) {
  const statusMap: Record<string, "pending" | "matched" | "discrepancy"> = {
    pending: "pending",
    confirmed: "matched",
    reversed: "discrepancy",
  };

  const conceptBySource: Record<string, string> = {
    invoice_payment: "Cobro de factura",
    manual: "Movimiento manual",
  };

  return {
    id: movement.id,
    date: movement.movementDate,
    concept: conceptBySource[movement.sourceType] ?? "Movimiento de caja",
    reference: movement.reference ?? `Origen: ${movement.sourceType}`,
    amount: movement.amount,
    type: movement.kind,
    status: statusMap[movement.status] ?? "pending",
  } satisfies BankStatementRow;
}

function mapMovementToErpRow(movement: {
  id: string;
  movementDate: string;
  kind: "income" | "expense";
  amount: number;
  sourceType: string;
  sourceId: string | null;
  reference: string | null;
  status: "pending" | "confirmed" | "reversed";
}) {
  const matchConfidence =
    movement.status === "pending" && movement.sourceType === "invoice_payment"
      ? 96
      : movement.status === "pending" && Boolean(movement.reference)
        ? 91
        : undefined;

  return {
    id: `erp-${movement.id}`,
    bankId: movement.id,
    date: movement.movementDate,
    concept: movement.sourceType === "invoice_payment" ? "Cobro relacionado a factura" : "Registro contable",
    reference: movement.sourceId ? `ID origen: ${movement.sourceId}` : (movement.reference ?? "Sin referencia"),
    amount: movement.amount,
    type: movement.kind,
    matchConfidence,
    isMissing: movement.status === "reversed",
  } satisfies ERPMatchRow;
}

export async function getReconciliationWorkspace(user: AuthUser) {
  if (!isSupabaseConfigured()) {
    return {
      bankRows: mockBankStatements,
      erpRows: mockERPRecords,
      persistent: false,
    };
  }

  const { cashMovements } = await getFinanceSourceData(user);

  return {
    bankRows: cashMovements.map(mapMovementToBankRow),
    erpRows: cashMovements.map(mapMovementToErpRow),
    persistent: true,
  };
}

export function getReconciliationFallbackRows() {
  return {
    bankRows: mockBankStatements,
    erpRows: mockERPRecords,
  };
}
