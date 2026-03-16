import React from 'react';
import { TrendingUp, Receipt, Percent, Package, ShoppingCart, CheckCircle, AlertTriangle, MoreHorizontal, ArrowUp, ArrowDown } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">¡Hola de nuevo, Empresa SPA!</h2>
        <p className="text-slate-500 dark:text-slate-400">Aquí está el resumen de tu operación hoy, 24 de Mayo.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-primary/10 p-2 rounded-lg"><TrendingUp className="text-primary w-5 h-5" /></span>
            <span className="text-green-500 text-sm font-medium flex items-center gap-1">+12.5% <ArrowUp className="w-3 h-3" /></span>
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ventas del Mes</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">$15.420.000</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-primary/10 p-2 rounded-lg"><Receipt className="text-primary w-5 h-5" /></span>
            <span className="text-orange-500 text-sm font-medium flex items-center gap-1">-5% <ArrowDown className="w-3 h-3" /></span>
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Facturas Pendientes</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">24</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-primary/10 p-2 rounded-lg"><Percent className="text-primary w-5 h-5" /></span>
            <span className="text-green-500 text-sm font-medium flex items-center gap-1">+2% <ArrowUp className="w-3 h-3" /></span>
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Margen Bruto</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">32%</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-primary/10 p-2 rounded-lg"><Package className="text-primary w-5 h-5" /></span>
            <span className="text-slate-500 text-sm font-medium">Stock bajo</span>
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Items en Alerta</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">12</p>
        </div>
      </div>

      {/* Chart & Actions Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Rendimiento de Ingresos (CLP)</h3>
            <select className="text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-primary outline-none">
              <option>Últimos 6 meses</option>
              <option>Este año</option>
            </select>
          </div>
          <div className="flex-1 flex flex-col justify-end min-h-[250px]">
            <p className="text-3xl font-bold mb-4">$84.200.000 <span className="text-green-500 text-sm font-normal ml-2">+8.2% vs periodo anterior</span></p>
            <div className="relative w-full h-48">
              <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 478 150" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z" fill="url(#paint0_linear)"></path>
                <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#ec5b13" strokeLinecap="round" strokeWidth="3"></path>
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear" x1="236" x2="236" y1="1" y2="149">
                    <stop stopColor="#ec5b13" stopOpacity="0.2"></stop>
                    <stop offset="1" stopColor="#ec5b13" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex justify-between mt-4 text-xs font-semibold text-slate-500 uppercase">
                <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar (Recent Actions) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Acciones Recientes</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <ShoppingCart className="text-blue-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nueva Orden #4521</p>
                <p className="text-xs text-slate-500">Heredia Alimentos - Hace 5 min</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle className="text-green-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Factura Pagada</p>
                <p className="text-xs text-slate-500">Orden #4490 - Hace 2 horas</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="text-orange-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Stock Crítico</p>
                <p className="text-xs text-slate-500">Aceite Industrial 5L - Hace 4 horas</p>
              </div>
            </div>
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
            Ver toda la actividad
          </button>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold">Últimas Ventas</h3>
          <button className="text-primary text-sm font-semibold hover:underline">Ver todo</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Monto</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">LS</div>
                    <span className="font-medium">Logística del Sur</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">24 May, 2024</td>
                <td className="px-6 py-4 text-sm font-bold">$1.240.000</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold">Pagado</span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-slate-400 hover:text-primary"><MoreHorizontal className="w-5 h-5" /></button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">CT</div>
                    <span className="font-medium">Constructora Terra</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">23 May, 2024</td>
                <td className="px-6 py-4 text-sm font-bold">$850.000</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-xs font-semibold">Pendiente</span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-slate-400 hover:text-primary"><MoreHorizontal className="w-5 h-5" /></button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">MA</div>
                    <span className="font-medium">Minera Antares</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">22 May, 2024</td>
                <td className="px-6 py-4 text-sm font-bold">$4.120.000</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold">Pagado</span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-slate-400 hover:text-primary"><MoreHorizontal className="w-5 h-5" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
