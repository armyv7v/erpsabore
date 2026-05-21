import React from 'react';
import { ArrowRight, FileBadge, CalendarRange, UserCircle, Settings } from 'lucide-react';
import { mockHRNews, employeeProfile } from '@/data/hrPortal';
import Image from 'next/image';

// Fallback icon for Payments
const PaymentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>;
const BeachIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[120px] h-[120px]"><path d="m11 12 11-11"/><path d="m5.5 17.5-3.5 3.5"/><circle cx="11" cy="12" r="7"/><path d="m11 5 3 3"/><path d="m18 12-3 3"/></svg>;

export default function HRPortalPage() {
  return (
    <div className="relative flex min-h-screen w-full mx-auto flex-col bg-background-light dark:bg-background-dark overflow-x-hidden md:max-w-2xl lg:max-w-4xl border-x border-slate-200 dark:border-slate-800">
      {/* Header specifically designed for the mobile-first Portal look */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary shrink-0 relative">
            <Image 
              src={employeeProfile.avatarUrl} 
              alt="Foto de perfil del empleado" 
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Hola, {employeeProfile.name}</p>
            <h2 className="text-sm font-bold leading-tight">Portal Empleado</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-8">
        {/* Welcome Card */}
        <section className="p-4">
          <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-white shadow-lg shadow-primary/20">
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold mb-1">¡Buen día, {employeeProfile.name}!</h3>
              <p className="text-white/90 text-sm sm:text-base">Tienes {employeeProfile.availableVacationDays} días de vacaciones disponibles.</p>
              <button className="mt-6 bg-white text-primary px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
                Pedir Vacaciones
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute -right-8 -bottom-12 opacity-10 transform rotate-12 pointer-events-none">
              <BeachIcon />
            </div>
          </div>
        </section>

        {/* Quick Access Grid */}
        <section className="px-4 py-4">
          <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-4">Accesos Directos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="flex flex-col items-start gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary transition-colors text-left group shadow-sm">
              <div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <PaymentsIcon />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Mis Liquidaciones</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Última: {employeeProfile.lastPayslip}</p>
              </div>
            </button>

            <button className="flex flex-col items-start gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors text-left group shadow-sm">
              <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileBadge className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Mis Certificados</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Antigüedad, Renta</p>
              </div>
            </button>

            <button className="flex flex-col items-start gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-green-500 transition-colors text-left group shadow-sm">
              <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Saldo Vacaciones</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">{employeeProfile.availableVacationDays} días pendientes</p>
              </div>
            </button>

            <button className="flex flex-col items-start gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 transition-colors text-left group shadow-sm">
              <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <UserCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Mis Datos</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Actualizar perfil</p>
              </div>
            </button>
          </div>
        </section>

        {/* News / Announcements Section */}
        <section className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Comunicados</h3>
            <button className="text-primary text-xs font-bold uppercase tracking-wider hover:underline">Ver todos</button>
          </div>
          <div className="space-y-4">
            {mockHRNews.map((news) => (
              <div key={news.id} className="flex gap-4 p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 relative">
                  <Image 
                    src={news.imageUrl} 
                    alt={news.title} 
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col justify-center gap-1.5 py-1">
                  <span className={`text-[10px] font-bold uppercase ${news.categoryColor}`}>{news.category}</span>
                  <h4 className="text-sm font-bold leading-snug line-clamp-2 text-slate-900 dark:text-white">{news.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{news.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
