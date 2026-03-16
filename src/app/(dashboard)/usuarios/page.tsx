import React from 'react';
import { Search, UserPlus, MoreVertical, Send, Hourglass } from 'lucide-react';
import { mockUsers } from '@/data/users';
import Image from 'next/image';

export default function UsersPage() {
  const getRoleStyles = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-primary/10 text-primary';
      case 'Vendedor': return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
      case 'Contador': return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
      case 'Pendiente': return 'bg-primary/20 text-primary';
      case 'Soporte': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-slate-400';
      default: return 'bg-transparent';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header handled by Layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Control de accesos y roles</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 text-sm" 
              placeholder="Buscar usuario..." 
              type="text"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Total</p>
          <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">42</p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-green-500">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Activos</p>
          <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">38</p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-primary">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Pendientes</p>
          <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">4</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mt-4">
        <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Equipo</h3>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Invitar Usuario</span>
          <span className="sm:hidden">Invitar</span>
        </button>
      </div>

      {/* User List */}
      <div className="flex flex-col gap-3 pb-20">
        {mockUsers.map((user) => (
          <div key={user.id} className={`flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md ${user.status === 'inactive' ? 'opacity-70' : ''}`}>
            
            <div className="relative shrink-0">
              {user.status === 'pending' ? (
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Hourglass className="w-5 h-5" />
                </div>
              ) : (
                <>
                  <div className={`relative size-12 rounded-full overflow-hidden border-2 ${user.role === 'Admin' ? 'border-primary/20' : 'border-transparent'}`}>
                    {user.imageUrl && (
                      <Image 
                        src={user.imageUrl} 
                        alt={`Avatar de ${user.name}`} 
                        fill 
                        className={`object-cover ${user.status === 'inactive' ? 'grayscale' : ''}`}
                        unoptimized
                      />
                    )}
                  </div>
                  <div className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white dark:border-slate-900 ${getStatusIndicator(user.status)}`}></div>
                </>
              )}
            </div>

            <div className="flex flex-col flex-1 justify-center min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className={`text-slate-900 dark:text-white text-sm sm:text-base font-semibold leading-none truncate ${user.status === 'inactive' ? 'line-through' : ''} ${user.status === 'pending' ? 'italic font-medium' : ''}`}>
                  {user.name}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${getRoleStyles(user.role)} ${user.status === 'inactive' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : ''}`}>
                  {user.status === 'inactive' ? 'Inactivo' : user.role}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-normal truncate">{user.email}</p>
            </div>

            <div className="shrink-0 flex items-center">
              {user.status === 'pending' ? (
                <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors" title="Reenviar invitación">
                  <Send className="w-5 h-5" />
                </button>
              ) : (
                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}