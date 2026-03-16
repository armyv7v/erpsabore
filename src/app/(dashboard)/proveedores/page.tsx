import React from 'react';
import { Search, Filter, Store, Truck, Wrench, Phone, Mail, ChevronRight, Plus } from 'lucide-react';
import { mockSuppliers } from '@/data/suppliers';

export default function SuppliersPage() {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Store': return <Store className="w-6 h-6" />;
      case 'Truck': return <Truck className="w-6 h-6" />;
      case 'Wrench': return <Wrench className="w-6 h-6" />;
      default: return <Store className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header Section */}
      <div className="border-b border-primary/10 bg-white dark:bg-slate-900/50 p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Directorio de Proveedores</h1>
          </div>
          <button className="p-2 hover:bg-primary/10 rounded-full transition-colors text-slate-600 dark:text-slate-400">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Component */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input 
            className="block w-full pl-10 pr-3 py-3 border-none bg-primary/5 rounded-xl focus:ring-2 focus:ring-primary text-sm placeholder:text-slate-400 dark:bg-slate-800 outline-none" 
            placeholder="Buscar por nombre, RUT o categoría" 
            type="text"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
          <button className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-semibold whitespace-nowrap">Todos</button>
          <button className="px-4 py-1.5 rounded-full bg-primary/10 text-slate-700 dark:text-slate-300 text-xs font-medium whitespace-nowrap hover:bg-primary/20 transition-colors">Suministros</button>
          <button className="px-4 py-1.5 rounded-full bg-primary/10 text-slate-700 dark:text-slate-300 text-xs font-medium whitespace-nowrap hover:bg-primary/20 transition-colors">Logística</button>
          <button className="px-4 py-1.5 rounded-full bg-primary/10 text-slate-700 dark:text-slate-300 text-xs font-medium whitespace-nowrap hover:bg-primary/20 transition-colors">Servicios</button>
          <button className="px-4 py-1.5 rounded-full bg-primary/10 text-slate-700 dark:text-slate-300 text-xs font-medium whitespace-nowrap hover:bg-primary/20 transition-colors">Importaciones</button>
        </div>
      </div>

      {/* Main Content: Provider List */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockSuppliers.map((supplier) => (
            <div 
              key={supplier.id} 
              className={`bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/30 transition-all ${
                supplier.pendingBalance === 0 ? 'opacity-80' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {getCategoryIcon(supplier.iconName)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">{supplier.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">RUT: {supplier.rut}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Saldo Pendiente</p>
                  <p className={`text-lg font-bold ${supplier.pendingBalance > 0 ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                    \${supplier.pendingBalance.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  {supplier.category}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className={`text-xs ${
                  supplier.statusType === 'warning' ? 'text-amber-500 font-medium' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {supplier.statusText}
                </span>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors">
                  <Phone className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Llamar</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Email</span>
                </button>
                <button className="px-3 flex items-center justify-center py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-primary transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="md:hidden fixed right-6 bottom-24 size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-20">
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}