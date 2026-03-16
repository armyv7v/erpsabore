import React from 'react';
import { Plus, CheckCircle2, Clock, AlertTriangle, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockInvoices } from '@/data/sales';

export default function SalesPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header handled by Layout, we just add the page title info */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Ventas e Invoicing</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Resumen y facturación</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Pagado</p>
            <CheckCircle2 className="text-green-500 w-5 h-5" />
          </div>
          <p className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl font-bold">\$4.500.000</p>
          <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">+12% vs mes anterior</p>
        </div>
        
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pendiente</p>
            <Clock className="text-amber-500 w-5 h-5" />
          </div>
          <p className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl font-bold">\$1.200.000</p>
          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">8 facturas por cobrar</p>
        </div>
        
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Atrasado</p>
            <AlertTriangle className="text-red-500 w-5 h-5" />
          </div>
          <p className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl font-bold">\$450.000</p>
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Acción requerida</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 gap-4">
        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold">Facturas Recientes</h2>
        <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-bold transition-colors w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          <span>Nueva Factura</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary px-4 text-white text-sm font-medium">
          Todas
        </button>
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Pagada
        </button>
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Pendiente
        </button>
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          Atrasada
        </button>
      </div>

      {/* Invoices List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Folio / RUT</th>
                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Cliente</th>
                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Monto (CLP)</th>
                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Estado</th>
                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mockInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{invoice.folio}</p>
                    <p className="text-xs text-slate-500">{invoice.rut}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{invoice.clientName}</p>
                    <p className="text-xs text-slate-500">Emitida: {invoice.date}</p>
                  </td>
                  <td className="px-4 py-4 font-bold">
                    \${invoice.amount.toLocaleString('es-CL')}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      invoice.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : 'Atrasada'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="text-slate-400 hover:text-primary transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">Mostrando 4 de 128 facturas</p>
          <div className="flex gap-2">
            <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}