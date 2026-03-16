import React from 'react';
import { Filter, Download, TrendingUp, Analytics, Banknotes, Inventory, AccountBalanceWallet, EmojiEvents, ChevronRight, PieChart } from 'lucide-react';
import { mockPLData } from '@/data/pandl';

// Simple fallback icons for missing lucide ones
const BanknotesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>;
const InventoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>;
const EmojiEventsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const AccountWalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-5 7.18"/><path d="M20 11a2 2 0 0 0 0 4h4v-4Z"/></svg>;


export default function ProfitAndLossPage() {
  return (
    <div className="max-w-4xl mx-auto pb-24 md:p-8 space-y-6">
      
      {/* Header handled by Layout */}
      <div className="flex justify-between items-center px-4 md:px-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estado de Resultados</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">P&L Consolidado</p>
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

      {/* Time Range Selector */}
      <div className="px-4 md:px-0">
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
          <button className="px-4 py-3 text-sm font-bold border-b-2 border-primary text-primary">Mensual</button>
          <button className="px-4 py-3 text-sm font-medium text-slate-500 hover:text-primary transition-colors">Trimestral</button>
          <button className="px-4 py-3 text-sm font-medium text-slate-500 hover:text-primary transition-colors">Anual</button>
        </div>
      </div>

      {/* Main Trend Chart Card */}
      <div className="px-4 md:px-0">
        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Utilidad Neta del Periodo</p>
              <p className="text-3xl font-bold mt-1">\${mockPLData.netProfit.toLocaleString('es-CL')} <span className="text-xs font-normal text-slate-400">CLP</span></p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="text-emerald-500 w-4 h-4" />
                <p className="text-emerald-500 text-sm font-medium">{mockPLData.netProfitGrowth} vs mes anterior</p>
              </div>
            </div>
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <PieChart className="w-6 h-6" />
            </div>
          </div>
          
          {/* Simple Bar Chart Visualization */}
          <div className="flex items-end justify-between h-40 gap-2 px-2 mt-8">
            {mockPLData.chartData.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 gap-2 h-full justify-end">
                <div 
                  className={`w-full rounded-t-lg relative group cursor-pointer transition-all hover:opacity-90 ${data.isActive ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800'}`} 
                  style={{ height: `${data.percentage}%` }}
                >
                  {!data.isActive && <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg"></div>}
                </div>
                <span className={`text-[10px] font-bold uppercase ${data.isActive ? 'text-primary' : 'text-slate-400'}`}>{data.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary Breakdown */}
      <div className="px-4 md:px-0 space-y-4">
        <h2 className="text-lg font-bold px-1">Desglose Financiero</h2>
        
        {/* Revenue Card */}
        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-primary/30 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
              <BanknotesIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Ingresos Totales</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">\${mockPLData.totalRevenue.toLocaleString('es-CL')}</p>
            </div>
          </div>
          <ChevronRight className="text-slate-400 group-hover:text-primary transition-colors" />
        </div>

        {/* COGS Card */}
        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-primary/30 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
              <InventoryIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Costo de Ventas (COGS)</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">\${mockPLData.cogs.toLocaleString('es-CL')}</p>
            </div>
          </div>
          <ChevronRight className="text-slate-400 group-hover:text-primary transition-colors" />
        </div>

        {/* Gross Margin Info */}
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 flex items-center justify-between border border-transparent">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Margen Bruto ({mockPLData.grossMarginPercentage}%)</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">\${mockPLData.grossMarginAmount.toLocaleString('es-CL')}</p>
        </div>

        {/* Operating Expenses Card */}
        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-primary/30 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
              <AccountWalletIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Gastos Operacionales</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">\${mockPLData.operatingExpenses.toLocaleString('es-CL')}</p>
            </div>
          </div>
          <ChevronRight className="text-slate-400 group-hover:text-primary transition-colors" />
        </div>

        {/* Net Profit Highlight */}
        <div className="bg-primary rounded-xl p-6 shadow-xl shadow-primary/20 text-white mt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/80 text-sm font-medium">Utilidad Operacional Neta</p>
              <p className="text-3xl font-black mt-1">\${mockPLData.netProfit.toLocaleString('es-CL')}</p>
            </div>
            <div className="size-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0">
              <EmojiEventsIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Small Stats Grid */}
      <div className="grid grid-cols-2 gap-4 px-4 md:px-0 pt-4">
        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase">Margen Neto</p>
          <p className="text-xl font-bold mt-1 text-primary">{mockPLData.netMarginPercentage}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase">ROI Estimado</p>
          <p className="text-xl font-bold mt-1 text-primary">{mockPLData.roiPercentage}%</p>
        </div>
      </div>
      
    </div>
  );
}