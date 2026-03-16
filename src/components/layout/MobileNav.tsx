import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Wallet, Package, Users, Menu } from 'lucide-react';

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:hidden flex justify-around p-2 z-50">
      <Link href="/" className="flex flex-col items-center gap-1 text-primary">
        <LayoutDashboard className="w-6 h-6" />
        <span className="text-[10px] font-medium">Inicio</span>
      </Link>
      <Link href="#" className="flex flex-col items-center gap-1 text-slate-500 hover:text-primary transition-colors">
        <Wallet className="w-6 h-6" />
        <span className="text-[10px] font-medium">Ventas</span>
      </Link>
      <Link href="#" className="flex flex-col items-center gap-1 text-slate-500 hover:text-primary transition-colors">
        <Package className="w-6 h-6" />
        <span className="text-[10px] font-medium">Stock</span>
      </Link>
      <Link href="#" className="flex flex-col items-center gap-1 text-slate-500 hover:text-primary transition-colors">
        <Users className="w-6 h-6" />
        <span className="text-[10px] font-medium">CRM</span>
      </Link>
      <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-primary transition-colors">
        <Menu className="w-6 h-6" />
        <span className="text-[10px] font-medium">Más</span>
      </button>
    </nav>
  );
}
