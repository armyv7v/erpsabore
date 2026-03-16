import React from 'react';
import { UserPlus, LineChart, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { mockPipeline, mockContacts } from '@/data/crm';

export default function CRMPage() {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'prospect': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'client': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'proposal': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'prospect': return 'Prospecto';
      case 'client': return 'Cliente';
      case 'proposal': return 'Propuesta';
      default: return 'Inactivo';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header Info */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Módulo CRM</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Gestión de clientes y oportunidades</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-xl font-semibold shadow-sm flex-1 whitespace-nowrap transition-colors">
          <UserPlus className="w-5 h-5" />
          <span>Nuevo Cliente</span>
        </button>
        <button className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-primary/30 text-primary px-4 py-3 rounded-xl font-semibold shadow-sm flex-1 whitespace-nowrap transition-colors">
          <LineChart className="w-5 h-5" />
          <span>Nueva Oportunidad</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Overview */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Pipeline de Ventas</h3>
              <p className="text-slate-500 text-sm">Resumen por etapas este mes</p>
            </div>
            <span className="text-primary font-bold text-lg">\$12.4M</span>
          </div>
          
          <div className="flex flex-col gap-6">
            {mockPipeline.map((stage) => (
              <div key={stage.id} className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{stage.name}</span>
                  <span className="text-slate-500">{stage.leads} Leads • \${stage.value}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`${stage.colorClass} h-full rounded-full transition-all duration-500`} 
                    style={{ width: `${stage.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KPIs & Contacts Column */}
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
            <div className="flex flex-1 flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Tasa de Conversión</p>
              <p className="text-slate-900 dark:text-white text-2xl font-bold">24.5%</p>
              <p className="text-emerald-500 text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> +3.2%
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Tiempo Cierre</p>
              <p className="text-slate-900 dark:text-white text-2xl font-bold">18 días</p>
              <p className="text-rose-500 text-xs font-semibold flex items-center gap-1">
                <TrendingDown className="w-4 h-4" /> -2 días
              </p>
            </div>
          </div>

          {/* Recent Contacts */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Contactos Recientes</h3>
              <button className="text-primary text-sm font-bold hover:underline">Ver todos</button>
            </div>
            <div className="flex flex-col gap-3">
              {mockContacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {contact.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{contact.name}</p>
                    <p className="text-slate-500 text-xs truncate">RUT: {contact.rut}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(contact.status)}`}>
                      {getStatusText(contact.status)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}