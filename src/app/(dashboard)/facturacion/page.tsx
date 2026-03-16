import React from 'react';
import { Search, ChevronDown, Filter, TrendingUp, PlusCircle, CheckCircle2, Clock, AlertTriangle, Plus } from 'lucide-react';
import { mockDTEs } from '@/data/billing';

export default function BillingPage() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle2 className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'rejected': return <AlertTriangle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'pending': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'rejected': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Aceptado SII';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado SII';
      default: return 'Desconocido';
    }
  };

  const getTypeStyles = (typeCode: string) => {
    switch (typeCode) {
      case 'F33': return 'text-primary bg-primary/10';
      case 'F39': return 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800';
      case 'F52': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 relative pb-24 md:pb-8">
      {/* Header handled by Layout */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Documentos DTE</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Listado de facturación electrónica</p>
      </div>

      {/* Search Bar */}
      <div className="w-full sm:w-96">
        <div className="relative flex items-center w-full h-12 rounded-xl bg-primary/10 text-primary">
          <Search className="absolute left-4 w-5 h-5" />
          <input 
            className="w-full h-full bg-transparent pl-12 pr-4 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500" 
            placeholder="Buscar por folio o cliente..." 
            type="text"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary text-white px-4 shadow-sm hover:bg-primary/90 transition-colors">
          <span className="text-sm font-medium">Este Mes</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/10 text-primary px-4 border border-primary/20 hover:bg-primary/20 transition-colors">
          <span className="text-sm font-medium">Factura (F33)</span>
          <Filter className="w-4 h-4" />
        </button>
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/10 text-primary px-4 border border-primary/20 hover:bg-primary/20 transition-colors">
          <span className="text-sm font-medium">Boleta (F39)</span>
        </button>
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/10 text-primary px-4 border border-primary/20 hover:bg-primary/20 transition-colors">
          <span className="text-sm font-medium">Guía (F52)</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 rounded-xl p-5 border border-primary/20 bg-white dark:bg-slate-800/50 shadow-sm">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-normal">Total Emitido (CLP)</p>
          <p className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl font-bold leading-tight">\$4.250.000</p>
          <div className="flex items-center gap-1">
            <TrendingUp className="text-emerald-500 w-4 h-4" />
            <p className="text-emerald-500 text-xs font-semibold">+12.5% vs mes ant.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 border border-primary/20 bg-white dark:bg-slate-800/50 shadow-sm">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-normal">Cantidad DTE</p>
          <p className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl font-bold leading-tight">128</p>
          <div className="flex items-center gap-1">
            <PlusCircle className="text-emerald-500 w-4 h-4" />
            <p className="text-emerald-500 text-xs font-semibold">+8 docs nuevos</p>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="mt-6">
        <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold mb-4">Documentos Recientes</h3>
        <div className="flex flex-col gap-3">
          {mockDTEs.map((dte) => (
            <div key={dte.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/50 transition-colors">
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded w-fit mb-2 ${getTypeStyles(dte.typeCode)}`}>
                  {dte.type} ({dte.typeCode})
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Folio: {dte.folio}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{dte.client}</p>
              </div>
              <div className="flex flex-col sm:items-end">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {dte.isTransfer ? '$0 (Traslado)' : `$${dte.amount.toLocaleString('es-CL')}`}
                </p>
                <span className={`flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${getStatusStyles(dte.status)}`}>
                  {getStatusIcon(dte.status)}
                  {getStatusText(dte.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button (Visible on Mobile) */}
      <button className="md:hidden fixed bottom-24 right-6 size-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition-transform">
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}