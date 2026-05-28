import React from "react";
import { CheckCircle2, Lightbulb, TrendingUp, Wallet } from "lucide-react";
import CashFlowActions from "@/components/erp/CashFlowActions";
import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { getFinanceMetrics } from "@/lib/services/metrics-service";
import MovementsClient from "./movements-client";

export const dynamic = "force-dynamic";

export default async function CashFlowPage() {
  const user = await requireAuthenticatedUser();
  const { cashFlow } = await getFinanceMetrics(user);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wallet className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Flujo de Caja</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Métrica derivada desde movimientos y cuentas por cobrar.</p>
          </div>
        </div>
        <CashFlowActions movements={cashFlow.movements} today={new Date().toISOString().slice(0, 10)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Saldo Disponible</p>
          <h3 className="text-2xl font-bold mt-1">${cashFlow.availableCash.toLocaleString("es-CL")} CLP</h3>
          <div className="mt-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>${cashFlow.pendingReceivables.toLocaleString("es-CL")} por cobrar</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Entradas Confirmadas</p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-500">${cashFlow.monthlyIncome.toLocaleString("es-CL")} CLP</h3>
          <p className="text-xs text-slate-400 mt-2">Derivadas de pagos registrados.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Salidas</p>
          <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-500">${cashFlow.monthlyExpenses.toLocaleString("es-CL")} CLP</h3>
          <p className="text-xs text-slate-400 mt-2">${cashFlow.committedPayments.toLocaleString("es-CL")} comprometidos con proveedores</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Flujo Neto</p>
          <h3 className="text-2xl font-bold mt-1 text-primary">${cashFlow.netFlow.toLocaleString("es-CL")} CLP</h3>
          <div className="mt-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>{cashFlow.netFlow >= 0 ? "Superávit operativo" : "Déficit operativo"}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h4 className="text-lg font-bold">Proyección de Caja</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Basada en pagos confirmados, cuentas por cobrar y compromisos.</p>
          </div>
          <div className="bg-primary/5 px-4 py-2 rounded-lg">
            <p className="text-xs text-primary font-bold uppercase tracking-wider">Saldo Proyectado</p>
            <p className="text-xl font-bold text-primary">${cashFlow.projectedCash.toLocaleString("es-CL")} CLP</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-6 border border-slate-100 dark:border-slate-800">
            <h5 className="font-bold mb-4">Distribución de egresos</h5>
            <div className="space-y-4">
              {cashFlow.expenseDistribution.length === 0 ? (
                <p className="text-sm text-slate-500">Aún no hay egresos persistidos en la base.</p>
              ) : (
                cashFlow.expenseDistribution.map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{item.category}</span>
                      <span className="font-bold">{item.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl bg-primary/5 p-6 border border-primary/10">
            <div className="flex gap-3 items-start">
              <Lightbulb className="text-primary w-5 h-5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold text-primary mb-1">Lectura operativa</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Esta vista ya no depende de cifras quemadas: refleja el estado de facturas emitidas, pagos y cuentas por cobrar disponibles en la capa de servicios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="mb-6">
          <h4 className="text-lg font-bold">Movimientos recientes</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">Entradas y salidas confirmadas/pendientes registradas en caja.</p>
        </div>

        <MovementsClient movements={cashFlow.movements} />
      </div>
    </div>
  );
}
