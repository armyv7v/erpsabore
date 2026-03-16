import React from 'react';
import { Wallet, Download, Plus, TrendingUp, TrendingDown, CheckCircle2, Lightbulb } from 'lucide-react';
import { mockCashFlow, expenseDistribution } from '@/data/finance';

export default function CashFlowPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wallet className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Flujo de Caja</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Actualizado hace 5 minutos</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0">
            <Download className="w-5 h-5" />
          </button>
          <button className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 -mx-4 md:-mx-8 px-4 md:px-8 mb-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-8 w-max">
          <a className="border-b-2 border-primary py-4 text-sm font-bold text-primary" href="#">Resumen</a>
          <a className="border-b-2 border-transparent py-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" href="#">Ingresos</a>
          <a className="border-b-2 border-transparent py-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" href="#">Egresos</a>
          <a className="border-b-2 border-transparent py-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" href="#">Proyecciones</a>
        </div>
      </nav>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Saldo Disponible</p>
          <h3 className="text-2xl font-bold mt-1">\$12.450.000 CLP</h3>
          <div className="mt-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>+5.2% vs mes ant.</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Entradas (Mes)</p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-500">\$8.200.000 CLP</h3>
          <p className="text-xs text-slate-400 mt-2">128 Facturas emitidas</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Salidas (Mes)</p>
          <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-500">\$5.100.000 CLP</h3>
          <p className="text-xs text-slate-400 mt-2">Pagos a proveedores y sueldos</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Flujo Neto</p>
          <h3 className="text-2xl font-bold mt-1 text-primary">\$3.100.000 CLP</h3>
          <div className="mt-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Superávit</span>
          </div>
        </div>
      </div>

      {/* Projection Chart Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h4 className="text-lg font-bold">Proyección de Caja 30 Días</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Basado en facturas por cobrar y compromisos de pago</p>
          </div>
          <div className="bg-primary/5 px-4 py-2 rounded-lg">
            <p className="text-xs text-primary font-bold uppercase tracking-wider">Saldo Proyectado</p>
            <p className="text-xl font-bold text-primary">\$15.800.000 CLP</p>
          </div>
        </div>
        <div className="w-full h-[240px] relative mt-4">
          <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 478 150" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z" fill="rgba(236, 91, 19, 0.05)"></path>
            <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#ec5b13" strokeLinecap="round" strokeWidth="3"></path>
          </svg>
          <div className="flex justify-between mt-4 border-t border-slate-100 dark:border-slate-800 pt-2 px-2">
            <p className="text-slate-400 text-xs font-bold uppercase">Hoy</p>
            <p className="text-slate-400 text-xs font-bold uppercase">10 Jun</p>
            <p className="text-slate-400 text-xs font-bold uppercase">20 Jun</p>
            <p className="text-slate-400 text-xs font-bold uppercase">30 Jun</p>
          </div>
        </div>
      </div>

      {/* Recent Movements & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
        
        {/* Transactions Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h4 className="text-lg font-bold">Movimientos Recientes</h4>
            <button className="text-primary text-sm font-semibold hover:underline">Ver todo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Concepto</th>
                  <th className="px-6 py-3 text-right">Monto (CLP)</th>
                  <th className="px-6 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockCashFlow.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm whitespace-nowrap">{transaction.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm sm:text-base">{transaction.concept}</span>
                        <span className="text-xs text-slate-400">{transaction.category}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                      {transaction.type === 'income' ? '+' : '-'}\${transaction.amount.toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          transaction.status === 'conciliado' 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h4 className="text-lg font-bold mb-6">Distribución de Egresos</h4>
          <div className="space-y-6">
            {expenseDistribution.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">{item.category}</span>
                  <span className="font-bold">{item.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className={`h-2 rounded-full ${item.colorClass}`} style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex gap-3 items-start">
              <Lightbulb className="text-primary w-5 h-5 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-primary mb-1">Tip de Ahorro</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Sus costos de proveedores subieron 12% este mes. Considere re-negociar términos de pago.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}