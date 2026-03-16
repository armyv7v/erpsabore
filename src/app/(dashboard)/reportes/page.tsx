import React from 'react';
import { CalendarDays, Building2, Download, Banknotes, TrendingUp, Percent, MousePointerClick, TrendingDown, MoreHorizontal } from 'lucide-react';
import { mockBIMetrics, mockTopSalesReps } from '@/data/bi';
import Image from 'next/image';

// Fallback icon
const BanknotesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>;

export default function BIDashboardPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold">Inteligencia de Negocios</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Resumen ejecutivo e indicadores clave</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-sm flex-1 md:flex-none">
            <CalendarDays className="text-slate-400 w-4 h-4 shrink-0" />
            <select className="w-full border-none bg-transparent p-0 text-sm font-medium focus:ring-0 outline-none text-slate-700 dark:text-slate-300">
              <option>Últimos 30 Días</option>
              <option>Último Trimestre</option>
              <option>Año actual</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-sm flex-1 md:flex-none">
            <Building2 className="text-slate-400 w-4 h-4 shrink-0" />
            <select className="w-full border-none bg-transparent p-0 text-sm font-medium focus:ring-0 outline-none text-slate-700 dark:text-slate-300">
              <option>Toda la Empresa</option>
              <option>Ventas</option>
              <option>Operaciones</option>
            </select>
          </div>
          <button className="flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ingresos Totales (USD)</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <BanknotesIcon />
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-bold tracking-tight">\${mockBIMetrics.totalRevenue.toLocaleString('en-US')}</h3>
              <p className="mt-1 flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                {mockBIMetrics.revenueGrowth}% <span className="ml-1 text-slate-400 font-normal">vs mes ant.</span>
              </p>
            </div>
            {/* Mini bar chart visual */}
            <div className="h-10 w-24 flex items-end gap-1">
              <div className="w-full rounded-t-sm bg-primary/20 h-[40%]"></div>
              <div className="w-full rounded-t-sm bg-primary/20 h-[60%]"></div>
              <div className="w-full rounded-t-sm bg-primary/20 h-[50%]"></div>
              <div className="w-full rounded-t-sm bg-primary/20 h-[80%]"></div>
              <div className="w-full rounded-t-sm bg-primary h-full"></div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Margen Bruto</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Percent className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-bold tracking-tight">{mockBIMetrics.grossMargin}%</h3>
              <p className="mt-1 flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                {mockBIMetrics.marginGrowth}% <span className="ml-1 text-slate-400 font-normal">vs mes ant.</span>
              </p>
            </div>
            <div className="h-10 w-24 flex items-end gap-1">
              <div className="w-full rounded-t-sm bg-primary/20 h-[70%]"></div>
              <div className="w-full rounded-t-sm bg-primary/20 h-[65%]"></div>
              <div className="w-full rounded-t-sm bg-primary/20 h-[75%]"></div>
              <div className="w-full rounded-t-sm bg-primary/20 h-[80%]"></div>
              <div className="w-full rounded-t-sm bg-primary h-[85%]"></div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Costo Adquisición (CAC)</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
              <MousePointerClick className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-bold tracking-tight">\${mockBIMetrics.cac.toFixed(2)}</h3>
              <p className="mt-1 flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                <TrendingDown className="w-4 h-4 mr-1" />
                {mockBIMetrics.cacImprovement}% <span className="ml-1 text-slate-400 font-normal">mejora</span>
              </p>
            </div>
            <div className="h-10 w-24 flex items-end gap-1">
              <div className="w-full rounded-t-sm bg-primary/20 h-full"></div>
              <div className="w-full rounded-t-sm bg-primary/20 h-[90%]"></div>
              <div className="w-full rounded-t-sm bg-primary/20 h-[80%]"></div>
              <div className="w-full rounded-t-sm bg-primary/20 h-[70%]"></div>
              <div className="w-full rounded-t-sm bg-primary h-[60%]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pt-2 pb-24 md:pb-0">
        {/* Revenue Trends (Line Chart Simulation) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="font-bold">Tendencia de Ingresos</h4>
            <button className="text-slate-400 hover:text-slate-600 transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
          </div>
          <div className="relative h-64 w-full">
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 200">
              <defs>
                <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ec5b13" stopOpacity="0.3"></stop>
                  <stop offset="100%" stopColor="#ec5b13" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path d="M0,180 L40,160 L80,170 L120,130 L160,140 L200,90 L240,110 L280,60 L320,70 L360,30 L400,45" fill="none" stroke="#ec5b13" strokeLinecap="round" strokeWidth="3"></path>
              <path d="M0,180 L40,160 L80,170 L120,130 L160,140 L200,90 L240,110 L280,60 L320,70 L360,30 L400,45 L400,200 L0,200 Z" fill="url(#lineGradient)"></path>
              {/* Grid Lines */}
              <line className="text-slate-100 dark:text-slate-800" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="50" y2="50"></line>
              <line className="text-slate-100 dark:text-slate-800" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="100" y2="100"></line>
              <line className="text-slate-100 dark:text-slate-800" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="150" y2="150"></line>
            </svg>
            <div className="mt-4 flex justify-between text-xs font-bold text-slate-400">
              <span>ENE</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown (Doughnut Chart Simulation) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="font-bold">Ingresos por Categoría</h4>
            <button className="text-slate-400 hover:text-slate-600 transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
          </div>
          <div className="flex flex-col sm:flex-row h-auto sm:h-64 items-center gap-8 justify-center sm:justify-start">
            <div className="relative flex h-48 w-48 items-center justify-center shrink-0">
              <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                <circle className="text-slate-100 dark:text-slate-800" cx="18" cy="18" fill="transparent" r="16" stroke="currentColor" strokeWidth="4"></circle>
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#ec5b13" strokeDasharray="45 100" strokeLinecap="round" strokeWidth="4"></circle>
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#fbd38d" strokeDasharray="30 100" strokeDashoffset="-45" strokeLinecap="round" strokeWidth="4"></circle>
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#94a3b8" strokeDasharray="25 100" strokeDashoffset="-75" strokeLinecap="round" strokeWidth="4"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">100%</span>
                <span className="text-[10px] uppercase text-slate-400 font-bold">Total</span>
              </div>
            </div>
            <div className="flex-1 space-y-4 w-full sm:w-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  <span className="text-sm font-medium">Software</span>
                </div>
                <span className="text-sm font-bold">45%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-300"></div>
                  <span className="text-sm font-medium">Hardware</span>
                </div>
                <span className="text-sm font-bold">30%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-400"></div>
                  <span className="text-sm font-medium">Servicios</span>
                </div>
                <span className="text-sm font-bold">25%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Sales Reps (Bar Chart Simulation) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h4 className="font-bold">Mejores Vendedores</h4>
            <div className="flex gap-2">
              <button className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold transition-colors">Este Mes</button>
              <button className="rounded-lg px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Histórico</button>
            </div>
          </div>
          <div className="space-y-6">
            {mockTopSalesReps.map((rep) => (
              <div key={rep.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full overflow-hidden relative shrink-0">
                      <Image 
                        src={rep.avatarUrl} 
                        alt={rep.name} 
                        fill 
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-sm font-semibold">{rep.name}</span>
                  </div>
                  <span className="text-sm font-bold">\${rep.sales.toLocaleString('en-US')}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${rep.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}