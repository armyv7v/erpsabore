import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatInvoiceStatus } from "@/lib/formatters/status";
import { requireAuthenticatedUser, createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";
import { getDashboardMetrics } from "@/lib/services/metrics-service";
import type { AuthUser, DashboardMetrics, InvoiceRecord, InvoiceStatus } from "@/lib/types/erp";

export const dynamic = "force-dynamic";

const importe = (value: number) => `$${Math.round(value).toLocaleString("es-CL")}`;

const statusTone: Record<InvoiceStatus, string> = {
  paid: "bg-[var(--color-positive-bg)] text-[var(--color-positive-ink)]",
  issued: "bg-slate-100 text-slate-700",
  draft: "bg-slate-100 text-slate-700",
  partially_paid: "bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)]",
  overdue: "bg-[var(--color-negative-bg)] text-[var(--color-negative-ink)]",
  cancelled: "bg-slate-100 text-slate-500",
};

function StatusPill({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex h-5 items-center whitespace-nowrap rounded-chip px-2 text-[11px] font-medium ${statusTone[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {formatInvoiceStatus(status)}
    </span>
  );
}

function Kpi({
  label,
  value,
  unit,
  hint,
  href,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  href?: string;
  tone?: "negative";
}) {
  const body = (
    <>
      <p className="text-[12px] leading-4 text-muted">{label}</p>
      <p
        className={`mt-1 text-[24px] font-normal leading-7 tabular-nums ${
          tone === "negative" ? "text-[var(--color-negative)]" : "text-ink"
        }`}
      >
        {value}
        {unit ? <span className="ml-1 text-[12px] text-muted">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-0.5 text-[12px] leading-4 text-muted">{hint}</p> : null}
    </>
  );

  return href ? (
    <Link href={href} className="block px-5 py-4 transition-colors hover:bg-slate-50">
      {body}
    </Link>
  ) : (
    <div className="px-5 py-4">{body}</div>
  );
}

function InvoicesTable({
  invoices,
  showCustomer = true,
}: {
  invoices: InvoiceRecord[];
  showCustomer?: boolean;
}) {
  if (invoices.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-[13px] text-muted">Todavía no hay facturas emitidas en este periodo.</p>
        <Link
          href="/facturacion"
          className="mt-2 inline-block text-[13px] font-medium text-ink underline underline-offset-4"
        >
          Emitir la primera
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-[12px] text-muted">
            {showCustomer ? (
              <th scope="col" className="px-5 py-2 text-left font-normal">Cliente</th>
            ) : (
              <th scope="col" className="px-5 py-2 text-left font-normal">Documento</th>
            )}
            <th scope="col" className="px-5 py-2 text-left font-normal">Emisión</th>
            <th scope="col" className="px-5 py-2 text-right font-normal">Monto</th>
            <th scope="col" className="px-5 py-2 text-left font-normal">Estado</th>
            <th scope="col" className="px-5 py-2"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="text-[13px] text-muted hover:bg-slate-50">
              <td className="px-5 py-3 font-medium text-ink">
                <span className="block max-w-[220px] truncate">
                  {showCustomer ? invoice.customerName : `Factura #${invoice.number}`}
                </span>
                {showCustomer ? (
                  <span className="block text-[11px] text-muted">#{invoice.number}</span>
                ) : null}
              </td>
              <td className="whitespace-nowrap px-5 py-3">{invoice.issueDate}</td>
              <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-ink">
                {importe(invoice.total)}
              </td>
              <td className="px-5 py-3"><StatusPill status={invoice.status} /></td>
              <td className="px-5 py-3 text-right">
                <Link
                  href="/facturacion"
                  className="whitespace-nowrap text-[12px] font-medium text-muted transition-colors hover:text-ink"
                >
                  Gestionar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PendingBlock({ metrics }: { metrics: DashboardMetrics }) {
  const items: { text: string; href: string }[] = [];
  if (metrics.pendingInvoicesCount > 0) {
    items.push({
      text: `${metrics.pendingInvoicesCount} ${metrics.pendingInvoicesCount === 1 ? "factura" : "facturas"} por cobrar`,
      href: "/facturacion",
    });
  }
  if (metrics.stockAlertCount > 0) {
    items.push({
      text: `${metrics.stockAlertCount} ${metrics.stockAlertCount === 1 ? "producto" : "productos"} bajo stock mínimo`,
      href: "/inventario?tab=low",
    });
  }

  return (
    <section className="rounded-card border border-border">
      <h2 className="px-5 pt-4 text-[16px] font-medium text-ink">Pendientes</h2>
      {items.length === 0 ? (
        <p className="px-5 pb-5 pt-2 text-[13px] text-muted">
          Nada por resolver: no hay facturas vencidas ni productos bajo su stock mínimo.
        </p>
      ) : (
        <ul className="mt-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 border-t border-rule px-5 py-3 text-[13px] text-ink transition-colors hover:bg-slate-50"
              >
                {item.text}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function kpisFor(
  role: AuthUser["role"],
  metrics: DashboardMetrics,
): React.ComponentProps<typeof Kpi>[] {
  const sales: React.ComponentProps<typeof Kpi> = {
    label: "Ventas del periodo",
    value: importe(metrics.monthlySales),
    unit: "CLP",
    hint: "Facturas emitidas",
    href: "/ventas",
  };
  const collected: React.ComponentProps<typeof Kpi> = {
    label: "Cobrado",
    value: importe(metrics.collectedTotal),
    unit: "CLP",
    hint: `${metrics.collectionRate}% de lo emitido`,
    href: "/facturacion",
  };
  const pending: React.ComponentProps<typeof Kpi> = {
    label: "Por cobrar",
    value: String(metrics.pendingInvoicesCount),
    unit: metrics.pendingInvoicesCount === 1 ? "factura" : "facturas",
    href: "/facturacion",
  };
  const alerts: React.ComponentProps<typeof Kpi> = {
    label: "Bajo stock mínimo",
    value: String(metrics.stockAlertCount),
    unit: metrics.stockAlertCount === 1 ? "producto" : "productos",
    href: "/inventario?tab=low",
    tone: metrics.stockAlertCount > 0 ? "negative" : undefined,
  };

  if (role === "bodega") return [alerts, pending, sales];
  if (role === "finanzas") return [sales, collected, pending, alerts];
  return [sales, collected, pending, alerts];
}

const primaryAction: Record<string, { label: string; href: string }> = {
  admin: { label: "Abrir punto de venta", href: "/pos" },
  ventas: { label: "Abrir punto de venta", href: "/pos" },
  finanzas: { label: "Conciliar movimientos", href: "/finanzas/conciliacion" },
  bodega: { label: "Revisar stock bajo", href: "/inventario?tab=low" },
};

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();

  if (user.role === "cliente") {
    let customerInvoices: InvoiceRecord[] = [];
    if (user.customerId) {
      const supabase = await createAuthenticatedSupabaseClient();
      const { data } = await supabase
        .from("invoices")
        .select("id, number, issue_date, due_date, total, status")
        .eq("customer_id", user.customerId)
        .order("created_at", { ascending: false })
        .limit(5);
      customerInvoices = (data ?? []) as unknown as InvoiceRecord[];
    }

    const hasPurchases = customerInvoices.length > 0;

    return (
      <div className="mx-auto max-w-[1240px] px-6 py-5">
        <div className="flex items-end justify-between gap-4">
          <p className="text-[13px] text-muted">Sus compras con Saboré Insumos</p>
          {hasPurchases ? (
            <Link
              href="/catalogo"
              className="inline-flex min-h-[44px] items-center rounded-control bg-[var(--color-primary)] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Explorar catálogo
            </Link>
          ) : null}
        </div>

        <section className="mt-4 rounded-card border border-border">
          <h2 className="px-5 pt-4 text-[16px] font-medium text-ink">Compras recientes</h2>
          {hasPurchases ? (
            <div className="mt-2">
              <InvoicesTable invoices={customerInvoices} showCustomer={false} />
            </div>
          ) : (
            <div className="px-5 pb-8 pt-3">
              <p className="text-[13px] text-muted">
                Aún no registra compras con Saboré Insumos. El catálogo muestra precios y stock
                vigentes para su cuenta.
              </p>
              <Link
                href="/catalogo"
                className="mt-4 inline-flex min-h-[44px] items-center rounded-control bg-[var(--color-primary)] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              >
                Explorar catálogo
              </Link>
            </div>
          )}
        </section>
      </div>
    );
  }

  let metrics: DashboardMetrics;
  try {
    metrics = await getDashboardMetrics(user);
  } catch {
    metrics = {
      monthlySales: 0,
      collectedTotal: 0,
      collectionRate: 0,
      pendingInvoicesCount: 0,
      stockAlertCount: 0,
      latestInvoices: [],
    };
  }

  const action = primaryAction[user.role] ?? primaryAction.admin;

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-5">
      <div className="flex items-end justify-between gap-4">
        <p className="text-[13px] text-muted">Periodo actual · {user.tenantName}</p>
        <Link
          href={action.href}
          className="inline-flex min-h-[44px] items-center rounded-control bg-[var(--color-primary)] px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          {action.label}
        </Link>
      </div>

      <section aria-label="Indicadores del periodo" className="mt-4 overflow-hidden rounded-card border border-border">
        <div className="grid grid-cols-2 divide-x divide-y divide-rule lg:grid-cols-4 lg:divide-y-0">
          {kpisFor(user.role, metrics).map((kpi) => (
            <Kpi key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-card border border-border lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="text-[16px] font-medium text-ink">Últimas facturas</h2>
            <Link href="/ventas" className="text-[12px] font-medium text-muted transition-colors hover:text-ink">
              Ver todas
            </Link>
          </div>
          <div className="mt-2">
            <InvoicesTable invoices={metrics.latestInvoices} />
          </div>
        </section>

        <PendingBlock metrics={metrics} />
      </div>

      {metrics.latestInvoices.length === 0 && (user.role === "admin" || user.role === "ventas") ? (
        <section className="mt-4 rounded-card border border-border px-5 py-4">
          <h2 className="text-[16px] font-medium text-ink">Para empezar el periodo</h2>
          <p className="mt-1 text-[13px] text-muted">
            Todavía no hay documentos emitidos. Tres caminos para el primer movimiento:
          </p>
          <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-3">
            {[
              { href: "/facturacion", title: "Emitir una factura", note: "Desde una venta o un cliente" },
              { href: "/pos", title: "Abrir el punto de venta", note: "Cobro en mostrador" },
              { href: "/inventario", title: "Revisar el inventario", note: "Precios, stock y alertas" },
            ].map((step) => (
              <li key={step.href}>
                <Link
                  href={step.href}
                  className="flex items-start justify-between gap-3 border-t border-rule pt-2 text-[13px] text-ink transition-colors hover:text-[var(--color-primary-ink)]"
                >
                  <span>
                    <span className="block font-medium">{step.title}</span>
                    <span className="block text-[12px] text-muted">{step.note}</span>
                  </span>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
