import React from 'react';
import { Store, Plus, Filter, MapPin, ChevronDown } from 'lucide-react';
import { mockBranches } from '@/data/branches';
import Image from 'next/image';

export default function BranchesPage() {
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Operativa': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Logística': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Sucursales</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Administración de ubicaciones</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium shadow-sm hover:bg-primary/90 transition-all">
            <Plus className="w-5 h-5" />
            <span>Añadir Sucursal</span>
          </button>
          <button className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full border border-primary/20 bg-white dark:bg-slate-800 px-4 transition-all hover:border-primary">
          <span className="text-sm font-medium">Región: Metropolitana</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full border border-primary/20 bg-white dark:bg-slate-800 px-4 transition-all hover:border-primary">
          <span className="text-sm font-medium">Comuna: Providencia</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full border border-primary/20 bg-white dark:bg-slate-800 px-4 transition-all hover:border-primary">
          <span className="text-sm font-medium">Estado: Activas</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Branch List */}
      <div className="space-y-4 pb-20">
        {mockBranches.map((branch) => (
          <div key={branch.id} className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all hover:shadow-md hover:border-primary/30">
            <div className="flex flex-col md:flex-row">
              <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden shrink-0">
                <Image 
                  src={branch.imageUrl} 
                  alt={`Imagen de ${branch.name}`} 
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  unoptimized
                />
              </div>
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{branch.name}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${getTypeStyles(branch.type)}`}>
                      {branch.type}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mb-4">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {branch.address}
                  </p>
                  
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-background-light dark:bg-slate-800/50 border border-primary/5">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 truncate">Stock Total</p>
                      <p className="text-lg font-bold text-primary truncate">{branch.stockTotal}</p>
                      <p className={`text-[10px] font-medium truncate ${branch.stockStatusColor === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                        {branch.stockStatus}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background-light dark:bg-slate-800/50 border border-primary/5">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 truncate">Ventas Hoy</p>
                      <p className="text-lg font-bold text-primary truncate">{branch.salesToday}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{branch.salesStatus}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background-light dark:bg-slate-800/50 border border-primary/5">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 truncate">Empleados</p>
                      <p className="text-lg font-bold text-primary truncate">{branch.employeesCount}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{branch.employeesStatus}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4 md:mt-0">
                  <button className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700">
                    Configurar
                  </button>
                  <button className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl shadow-sm hover:bg-primary/90 transition-all">
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}