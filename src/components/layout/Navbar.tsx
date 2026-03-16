import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-slate-600">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Panel de Control</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm w-64 outline-none" 
            placeholder="Buscar..." 
            type="text"
          />
        </div>
        <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
      </div>
    </header>
  );
}
