import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDown, ArrowUp, FileText, Grid2X2, MoreHorizontal, Package, Percent, Receipt, ShoppingCart, TrendingUp, Users, Wallet } from "lucide-react";
import { formatInvoiceStatus } from "@/lib/formatters/status";
import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { getDashboardMetrics } from "@/lib/services/metrics-service";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const metrics = await getDashboardMetrics(user);

  if (user.role === "ventas") {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Panel de Ventas</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Bienvenido {user.fullName}. Aqui tienes tus indicadores y accesos comerciales para {user.tenantName}.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-primary/10 p-2 rounded-lg"><TrendingUp className="text-primary w-5 h-5" /></span>
              <span className="text-green-500 text-sm font-medium flex items-center gap-1">{metrics.revenueTrendGrowth} <ArrowUp className="w-3 h-3" /></span>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ventas del Periodo</p>
            <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">${metrics.monthlySales.toLocaleString("es-CL")}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-orange-100 p-2 rounded-lg"><Receipt className="text-orange-600 w-5 h-5" /></span>
              <span className="text-orange-500 text-sm font-medium flex items-center gap-1">por cobrar <ArrowDown className="w-3 h-3" /></span>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Facturas Pendientes</p>
            <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{metrics.pendingInvoicesCount}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-primary/10 p-2 rounded-lg"><Wallet className="text-primary w-5 h-5" /></span>
              <span className="text-slate-500 text-sm font-medium">gestion comercial</span>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Documentos Recientes</p>
            <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{metrics.latestInvoices.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/ventas" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold"><Wallet className="w-4 h-4 text-primary" /> Ventas</p>
            <p className="mt-2 text-xs text-slate-500">Crear borradores y seguimiento comercial.</p>
          </Link>
          <Link href="/facturacion" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold"><FileText className="w-4 h-4 text-primary" /> Facturacion</p>
            <p className="mt-2 text-xs text-slate-500">Emitir y registrar pagos de facturas.</p>
          </Link>
          <Link href="/crm" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold"><Users className="w-4 h-4 text-primary" /> CRM</p>
            <p className="mt-2 text-xs text-slate-500">Gestion de clientes y oportunidades.</p>
          </Link>
          <Link href="/catalogo" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold"><Grid2X2 className="w-4 h-4 text-primary" /> Catalogo</p>
            <p className="mt-2 text-xs text-slate-500">Consulta productos y precios vigentes.</p>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold">Ultimas facturas comerciales</h3>
            <Link href="/ventas" className="text-sm font-semibold text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Emision</th>
                  <th className="px-6 py-4">Monto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {metrics.latestInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{invoice.customerName}</td>
                    <td className="px-6 py-4 text-sm">{invoice.issueDate}</td>
                    <td className="px-6 py-4 text-sm font-bold">${invoice.total.toLocaleString("es-CL")}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full text-xs font-semibold">
                        {formatInvoiceStatus(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href="/facturacion" className="text-sm font-semibold text-primary hover:underline">Gestionar</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "finanzas") {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Panel de Finanzas</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Hola {user.fullName}. Este panel prioriza caja, conciliacion y control de facturas por cobrar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ingresos del Periodo</p>
            <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">${metrics.monthlySales.toLocaleString("es-CL")}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Cuentas por Cobrar</p>
            <p className="text-2xl font-bold mt-2 text-orange-600">{metrics.pendingInvoicesCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Margen Bruto</p>
            <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">{metrics.grossMarginPercentage}%</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tendencia</p>
            <p className="text-2xl font-bold mt-2 text-green-600">{metrics.revenueTrendGrowth}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/facturacion" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold"><FileText className="w-4 h-4 text-primary" /> Facturacion</p>
            <p className="mt-2 text-xs text-slate-500">Emitir, cobrar y revisar estado de documentos.</p>
          </Link>
          <Link href="/finanzas/flujo-caja" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold"><Wallet className="w-4 h-4 text-primary" /> Flujo de Caja</p>
            <p className="mt-2 text-xs text-slate-500">Registrar movimientos y exportar caja.</p>
          </Link>
          <Link href="/finanzas/conciliacion" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold"><Receipt className="w-4 h-4 text-primary" /> Conciliacion</p>
            <p className="mt-2 text-xs text-slate-500">Auto-conciliar y resolver pendientes.</p>
          </Link>
          <Link href="/finanzas/estado-resultados" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold"><Percent className="w-4 h-4 text-primary" /> Estado de Resultados</p>
            <p className="mt-2 text-xs text-slate-500">Visualizar resultado operativo del periodo.</p>
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === "bodega") {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Panel de Bodega</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Hola {user.fullName}. Este panel concentra inventario, catalogo y despacho operativo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Items en Alerta</p>
            <p className="text-2xl font-bold mt-2 text-orange-600">{metrics.stockAlertCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Facturas Pendientes</p>
            <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">{metrics.pendingInvoicesCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tendencia Comercial</p>
            <p className="text-2xl font-bold mt-2 text-green-600">{metrics.revenueTrendGrowth}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/inventario" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold"><Package className="w-4 h-4 text-primary" /> Inventario</p>
            <p className="mt-2 text-xs text-slate-500">Control de stock, estados y cantidades.</p>
          </Link>
          <Link href="/catalogo" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold"><Grid2X2 className="w-4 h-4 text-primary" /> Catalogo</p>
            <p className="mt-2 text-xs text-slate-500">Consulta productos e imagenes vigentes.</p>
          </Link>
          <Link href="/despachos" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold"><ShoppingCart className="w-4 h-4 text-primary" /> Despachos</p>
            <p className="mt-2 text-xs text-slate-500">Coordinar entregas, estados y seguimiento.</p>
          </Link>
          <Link href="/proveedores" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold"><Users className="w-4 h-4 text-primary" /> Proveedores</p>
            <p className="mt-2 text-xs text-slate-500">Gestion de abastecimiento y compras.</p>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hola, {user.fullName}</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Resumen operativo del tenant {user.tenantName}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-primary/10 p-2 rounded-lg"><TrendingUp className="text-primary w-5 h-5" /></span>
            <span className="text-green-500 text-sm font-medium flex items-center gap-1">{metrics.revenueTrendGrowth} <ArrowUp className="w-3 h-3" /></span>
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ventas del Periodo</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">\${metrics.monthlySales.toLocaleString("es-CL")}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-primary/10 p-2 rounded-lg"><Receipt className="text-primary w-5 h-5" /></span>
            <span className="text-orange-500 text-sm font-medium flex items-center gap-1">por cobrar <ArrowDown className="w-3 h-3" /></span>
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Facturas Pendientes</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{metrics.pendingInvoicesCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-primary/10 p-2 rounded-lg"><Percent className="text-primary w-5 h-5" /></span>
            <span className="text-green-500 text-sm font-medium flex items-center gap-1">actual <ArrowUp className="w-3 h-3" /></span>
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Margen Bruto</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{metrics.grossMarginPercentage}%</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-primary/10 p-2 rounded-lg"><Package className="text-primary w-5 h-5" /></span>
            <span className="text-slate-500 text-sm font-medium">stock bajo</span>
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Items en Alerta</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{metrics.stockAlertCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Rendimiento de Ingresos</h3>
            <select className="text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-primary outline-none">
              <option>Periodo actual</option>
            </select>
          </div>
          <div className="flex-1 flex flex-col justify-end min-h-[220px]">
            <p className="text-3xl font-bold mb-4">
              \${metrics.revenueTrendTotal.toLocaleString("es-CL")}
              <span className="text-green-500 text-sm font-normal ml-2">{metrics.revenueTrendGrowth} sobre base actual</span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              {metrics.latestInvoices.map((invoice) => (
                <div key={invoice.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
                  <p className="text-xs text-slate-500">{invoice.number}</p>
                  <p className="font-semibold mt-1">{invoice.customerName}</p>
                  <p className="text-sm text-primary mt-2">\${invoice.total.toLocaleString("es-CL")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Acciones Recientes</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <ShoppingCart className="text-blue-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nueva factura disponible para emitir</p>
                <p className="text-xs text-slate-500">Revisa Ventas y Facturación para continuar.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <TrendingUp className="text-green-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Métricas conectadas a servicios</p>
                <p className="text-xs text-slate-500">Panel y finanzas ya consumen la nueva capa real.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="text-orange-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Configura Supabase para persistencia</p>
                <p className="text-xs text-slate-500">Mientras tanto, las lecturas usan fallback seguro.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold">Últimas Ventas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Emisión</th>
                <th className="px-6 py-4">Monto</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {metrics.latestInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{invoice.customerName}</td>
                  <td className="px-6 py-4 text-sm">{invoice.issueDate}</td>
                  <td className="px-6 py-4 text-sm font-bold">\${invoice.total.toLocaleString("es-CL")}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full text-xs font-semibold">
                      {formatInvoiceStatus(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-slate-400 hover:text-primary"><MoreHorizontal className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
