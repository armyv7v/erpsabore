import React from 'react';
import Link from 'next/link';
import { Store, LayoutDashboard, Wallet, Package, Users, FileText, Briefcase, UserCog, LineChart, ArrowRightLeft, PieChart } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-lg">
          <Store className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight">PymeSync</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4 px-2">Principal</div>
        <Link href="/" className="flex items-center gap-3 p-3 bg-primary/10 text-primary rounded-xl font-medium">
          <LayoutDashboard className="w-5 h-5" />
          Inicio
        </Link>
        <Link href="/ventas" className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <Wallet className="w-5 h-5" />
          Ventas
        </Link>
        <Link href="/inventario" className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <Package className="w-5 h-5" />
          Inventario
        </Link>
        <Link href="/crm" className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <Users className="w-5 h-5" />
          CRM
        </Link>
        
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-2">Finanzas</div>
        <Link href="/facturacion" className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <FileText className="w-5 h-5" />
          Facturación
        </Link>
        <Link href="/finanzas/flujo-caja" className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <LineChart className="w-5 h-5" />
          Flujo de Caja
        </Link>
        <Link href="/finanzas/conciliacion" className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <ArrowRightLeft className="w-5 h-5" />
          Conciliación
        </Link>
        <Link href="/finanzas/estado-resultados" className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <PieChart className="w-5 h-5" />
          Estado de Resultados
        </Link>

        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-2">Administración</div>
        <Link href="/empleados" className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <Briefcase className="w-5 h-5" />
          Empleados
        </Link>
        <Link href="/sucursales" className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <Store className="w-5 h-5" />
          Sucursales
        </Link>
        <Link href="/usuarios" className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <UserCog className="w-5 h-5" />
          Usuarios
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              className="w-full h-full object-cover" 
              alt="Avatar de usuario administrador" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBY82D8dDZ1LdVtVyA1MZEXI-0_ApPbEHvw2bRpDSW6WHWwok-ehnSrQCNFVfyI8uVpiH5ytY7l-yeeJBqc3wEoGYr0GtWsEV9OfC9zD2tLHos1Rj2ZCx7O7pk1hetpaWQA2fVu7VY9WyOxMURHPa7KjyjuVXyUWoKlz4sensRyDgkeNatYTNefXa8CfSAJj4NX95wrvSIEich2uMl3-6H2MjnHcqm9ubbYsXuH_VV-JTzh-_INUeAd7_IoJ9pLblDLjt2QWSUzhGk" 
            />
          </div>
          <div>
            <p className="text-sm font-semibold">Admin Chile</p>
            <p className="text-xs text-slate-500">Plan Premium</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
