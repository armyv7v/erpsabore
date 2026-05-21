import React from "react";
import { ChevronRight, Download, Filter, PieChart, TrendingUp } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { getFinanceMetrics } from "@/lib/services/metrics-service";

const BanknotesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>;
const InventoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>;

export default async function ProfitAndLossPage() {
  const user = await requireAuthenticatedUser();
  const { profitAndLoss } = await getFinanceMetrics(user);

  return (
    <div className="max-w-4xl mx-auto pb-24 md:p-8 space-y-6">
      <div className="flex justify-between items-center px-4 md:px-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estado de Resultados</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Consolidado desde ventas, pagos y costos proxy.</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700">
            <Filter className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 md:px-0">
        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Utilidad Neta del Periodo</p>
              <p className="text-3xl font-bold mt-1">\${profitAndLoss.netProfit.toLocaleString("es-CL")} <span className="text-xs font-normal text-slate-400">CLP</span></p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="text-emerald-500 w-4 h-4" />
                <p className="text-emerald-500 text-sm font-medium">{profitAndLoss.netMarginPercentage}% margen neto actual</p>
              </div>
            </div>
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <PieChart className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4">
              <p className="text-xs uppercase text-slate-500 font-bold">Ingresos</p>
              <p className="mt-1 font-bold">\${profitAndLoss.totalRevenue.toLocaleString("es-CL")}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4">
              <p className="text-xs uppercase text-slate-500 font-bold">COGS</p>
              <p className="mt-1 font-bold">\${profitAndLoss.costOfSales.toLocaleString("es-CL")}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4">
              <p className="text-xs uppercase text-slate-500 font-bold">Gastos</p>
              <p className="mt-1 font-bold">\${profitAndLoss.operatingExpenses.toLocaleString("es-CL")}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4">
              <p className="text-xs uppercase text-slate-500 font-bold">ROI</p>
              <p className="mt-1 font-bold">{profitAndLoss.roiPercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-0 space-y-4">
        <h2 className="text-lg font-bold px-1">Desglose Financiero</h2>

        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-primary/30 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
              <BanknotesIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Ingresos Totales</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">\${profitAndLoss.totalRevenue.toLocaleString("es-CL")}</p>
            </div>
          </div>
          <ChevronRight className="text-slate-400 group-hover:text-primary transition-colors" />
        </div>

        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-primary/30 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
              <InventoryIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Costo de Ventas</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">\${profitAndLoss.costOfSales.toLocaleString("es-CL")}</p>
            </div>
          </div>
          <ChevronRight className="text-slate-400 group-hover:text-primary transition-colors" />
        </div>

        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 flex items-center justify-between border border-transparent">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Margen Bruto ({profitAndLoss.grossMarginPercentage}%)</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">\${profitAndLoss.grossMarginAmount.toLocaleString("es-CL")}</p>
        </div>
      </div>
    </div>
  );
}
