"use client";
import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Clock, AlertTriangle, MoreVertical, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { mockInvoices, Invoice } from '@/data/sales';

export default function SalesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ client: '', rut: '', amount: '' });

  const filteredInvoices = useMemo(() => {
    return mockInvoices.filter((invoice) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = invoice.clientName.toLowerCase().includes(searchLower) || 
                            invoice.folio.toLowerCase().includes(searchLower) ||
                            invoice.rut.toLowerCase().includes(searchLower);
      
      const matchesTab = activeTab === 'all' ? true : invoice.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab]);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Simulando creación de factura para: ${newInvoice.client}`);
    setIsModalOpen(false);
    setNewInvoice({ client: '', rut: '', amount: '' });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 relative">
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

      {/* Action Bar & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between py-2 gap-4">
        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold hidden md:block">Facturas Recientes</h2>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, folio o RUT..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-bold transition-colors w-full sm:w-auto shrink-0 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Factura</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          Todas
        </button>
        <button 
          onClick={() => setActiveTab('paid')}
          className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 text-sm font-medium transition-colors ${activeTab === 'paid' ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/40 dark:border-green-800 dark:text-green-400' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Pagada
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-400' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Pendiente
        </button>
        <button 
          onClick={() => setActiveTab('overdue')}
          className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 text-sm font-medium transition-colors ${activeTab === 'overdue' ? 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:border-red-800 dark:text-red-400' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
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
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No se encontraron facturas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {filteredInvoices.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">Mostrando {filteredInvoices.length} facturas</p>
            <div className="flex gap-2">
              <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Nueva Factura */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold">Emitir Nueva Factura</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateInvoice} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Cliente / Razón Social</label>
                <input 
                  type="text" required
                  value={newInvoice.client} onChange={e => setNewInvoice({...newInvoice, client: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Ej. Constructora Los Andes SpA"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">RUT</label>
                <input 
                  type="text" required
                  value={newInvoice.rut} onChange={e => setNewInvoice({...newInvoice, rut: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                  placeholder="76.123.456-K"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Monto Neto (CLP)</label>
                <input 
                  type="number" required min="1"
                  value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="150000"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Emitir Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}