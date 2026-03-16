import React from 'react';
import { Search, UserPlus, MoreVertical } from 'lucide-react';
import { mockEmployees } from '@/data/employees';
import Image from 'next/image';

export default function EmployeesPage() {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'vacation': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'license': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'vacation': return 'Vacaciones';
      case 'license': return 'Licencia';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header handled partially by Layout, specific page actions here */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Directorio de Empleados</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gestión de recursos humanos</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors w-full sm:w-auto justify-center">
          <UserPlus className="w-5 h-5" />
          <span>Contratar Nuevo</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
          <input 
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400" 
            placeholder="Buscar por nombre, cargo o departamento..." 
            type="text"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button className="whitespace-nowrap bg-primary text-white px-4 py-1.5 rounded-full text-sm font-medium">Todos</button>
          <button className="whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-full text-sm font-medium hover:border-primary hover:text-primary transition-colors">Ventas</button>
          <button className="whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-full text-sm font-medium hover:border-primary hover:text-primary transition-colors">Operaciones</button>
          <button className="whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-full text-sm font-medium hover:border-primary hover:text-primary transition-colors">Recursos Humanos</button>
          <button className="whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-full text-sm font-medium hover:border-primary hover:text-primary transition-colors">Tecnología</button>
        </div>
      </div>

      {/* Employee List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
        {mockEmployees.map((employee) => (
          <div key={employee.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="relative size-14 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden border-2 border-primary/10 shrink-0">
                  <Image 
                    src={employee.imageUrl} 
                    alt={`Avatar de ${employee.name}`} 
                    fill 
                    className="object-cover" 
                    unoptimized // using unoptimized to bypass next/image config requirement for external urls in local dev
                  />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{employee.name}</h3>
                  <p className="text-xs font-medium text-primary">{employee.role}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Depto: {employee.department}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${getStatusStyles(employee.status)}`}>
                  {getStatusText(employee.status)}
                </span>
                <button className="text-slate-400 hover:text-primary transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}