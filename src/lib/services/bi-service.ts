import type { AuthUser } from "@/lib/types/erp";
import { getSalesWorkspace } from "@/lib/services/invoice-service";
import { getProductStockSummary } from "@/lib/repositories/product-repository";
import { createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockInvoices } from "@/data/sales";

export interface BIBaseMetrics {
  /** Revenue total de facturas emitidas/pagadas */
  totalRevenue: number;
  /** % de margen bruto sobre el revenue total */
  grossMargin: number;
  /** Crecimiento de margen vs base (referencia 30%) */
  marginGrowth: number;
  /** Costo promedio de adquisición por factura */
  cac: number;
  /** % de facturas efectivamente cobradas vs emitidas */
  cacImprovement: number;
  /** Serie mensual para el gráfico de tendencia */
  revenueSeries: Array<{ label: string; amount: number; percentage: number }>;
}

function toMonthLabel(dateStr: string) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-CL", { month: "short" })
    .format(date)
    .replace(".", "")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function buildRevenueSeries(
  invoices: Array<{ issueDate: string; total: number; status: string }>,
) {
  const statuses = new Set(["issued", "partially_paid", "paid", "overdue"]);
  const grouped = new Map<string, { label: string; amount: number; order: number }>();

  for (const invoice of invoices) {
    if (!statuses.has(invoice.status)) continue;
    const date = new Date(invoice.issueDate);
    if (isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = toMonthLabel(invoice.issueDate) ?? "?";
    const existing = grouped.get(key);

    if (existing) {
      existing.amount += invoice.total;
    } else {
      grouped.set(key, { label, amount: invoice.total, order: date.getTime() });
    }
  }

  const ordered = [...grouped.values()].sort((a, b) => a.order - b.order);
  const maxAmount = Math.max(...ordered.map((x) => x.amount), 1);

  return ordered.map((item) => ({
    label: item.label,
    amount: item.amount,
    percentage: Math.round((item.amount / maxAmount) * 100 * 10) / 10,
  }));
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export async function getBIBaseMetrics(user: AuthUser): Promise<BIBaseMetrics> {
  if (!isSupabaseConfigured()) {
    const committed = mockInvoices.filter((inv) =>
      ["paid", "pending", "overdue"].includes(inv.status),
    );
    const totalRevenue = committed.reduce((sum, inv) => sum + inv.amount, 0);
    const grossMargin = 58;
    const invoiceCount = Math.max(committed.length, 1);
    return {
      totalRevenue,
      grossMargin,
      marginGrowth: round(grossMargin - 30, 1),
      cac: round((totalRevenue * 0.08) / invoiceCount, 2),
      cacImprovement: round(
        (committed.filter((i) => i.status === "paid").length / invoiceCount) * 100,
        1,
      ),
      revenueSeries: [],
    };
  }

  const supabase = await createAuthenticatedSupabaseClient();
  const [workspace, stockSummary] = await Promise.all([
    getSalesWorkspace(user, { page: 1, pageSize: 10 }),
    getProductStockSummary(supabase, user.tenantId),
  ]);

  const totals = workspace.totals;
  const summary = workspace.summary;

  const totalRevenue = totals.totalIssued;
  const paidRevenue = summary.totalPaid;
  const invoiceCount = Math.max(totals.issuedCount, 1);

  // COGS estimado: inventario a precio de costo (40% del precio de venta) × rotación mensual (5%)
  // hasta tener datos de compras reales, es la mejor aproximación disponible
  const estimatedCogs = stockSummary.totalInventoryValue * 0.40 * 0.05 + totalRevenue * 0.42;
  const grossMarginAmount = totalRevenue - Math.round(estimatedCogs);
  const grossMargin = totalRevenue > 0
    ? round((grossMarginAmount / totalRevenue) * 100)
    : 0;

  // OPEX proxy: 8% del revenue total (hasta tener gastos operativos reales)
  const operatingExpenses = Math.round(totalRevenue * 0.08);
  const cac = round(operatingExpenses / invoiceCount, 2);

  // cacImprovement: % de facturas efectivamente cobradas (cierre efectivo)
  const cacImprovement = round((paidRevenue / Math.max(totalRevenue, 1)) * 100, 1);

  // Para construir el gráfico de tendencias de ventas mensuales real, consultamos la fecha, total y estado ligero de todas las facturas
  const { data: lightInvoices } = await supabase
    .from("invoices")
    .select("issue_date, total, status")
    .eq("tenant_id", user.tenantId);

  const revenueSeries = buildRevenueSeries(
    (lightInvoices ?? []).map((inv) => ({
      issueDate: inv.issue_date,
      total: Number(inv.total),
      status: inv.status,
    })),
  );

  return {
    totalRevenue,
    grossMargin,
    marginGrowth: round(grossMargin - 30, 1),
    cac,
    cacImprovement,
    revenueSeries,
  };
}
