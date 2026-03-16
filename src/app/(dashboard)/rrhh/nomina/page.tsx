import React from 'react';
import { Receipt, Sparkles, TrendingUp, Info, Verified, Download, Eye, Edit, Banknotes, PieChart, CalendarDays } from 'lucide-react';
import { mockPayrollSummary, mockPayrollEmployees } from '@/data/payroll';

// Fallback icon since AccountBalance has multiple interpretations in lucide
const BankIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>;


export default function PayrollPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'generated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500';
      case 'generated': return 'bg-blue-500';
      case 'pending': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagada';
      case 'generated': return 'Generada';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  const getActionIcon = (status: string) => {
    switch (status) {
      case 'paid': return <Eye className="w-5 h-5" />;
      case 'generated': return <BankIcon />;
      case 'pending': return <Edit className="w-5 h-5" />;
      default: return <Eye className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header specifically for Nomina */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-white">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">Nómina Chile PYME</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{mockPayrollSummary.month}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 lg:p-8 space-y-6 pb-24">
        {/* Welcome and Primary Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Resumen Mensual</h2>
            <p className="text-slate-500 dark:text-slate-400">Control de haberes y descuentos legales</p>
          </div>
          <button className="flex w-full md:w-auto items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5" />
            Generar Nómina del Mes
          </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Haberes</p>
              <Banknotes className="text-primary w-5 h-5" />
            </div>
            <p className="text-2xl font-bold leading-tight">\${mockPayrollSummary.totalHaberes.toLocaleString('es-CL')}</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="text-emerald-500 w-4 h-4" />
              <p className="text-emerald-500 text-xs font-semibold">{mockPayrollSummary.growthHaberes} vs ago</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Descuentos Legales</p>
              <BankIcon />
            </div>
            <p className="text-2xl font-bold leading-tight">\${mockPayrollSummary.totalDescuentos.toLocaleString('es-CL')}</p>
            <div className="flex items-center gap-1 text-slate-400">
              <Info className="w-4 h-4" />
              <p className="text-xs">AFP, Salud, AFC</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-primary/10 border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <p className="text-primary font-bold text-sm">Sueldo Líquido</p>
              <Banknotes className="text-primary w-5 h-5" />
            </div>
            <p className="text-primary text-2xl font-extrabold leading-tight">\${mockPayrollSummary.sueldoLiquidoTotal.toLocaleString('es-CL')}</p>
            <div className="flex items-center gap-1">
              <Verified className="text-primary w-4 h-4" />
              <p className="text-primary/80 text-xs font-semibold">Monto neto a transferir</p>
            </div>
          </div>
        </div>

        {/* Specific Breakdown Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-lg">Detalle de Empleados</h3>
            <button className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
          {/* Table of Employees */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Empleado</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Cargo</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Monto Líquido</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-center">Estado</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockPayrollEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300 shrink-0">
                          {emp.initials}
                        </div>
                        <span className="font-semibold text-sm whitespace-nowrap">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{emp.role}</td>
                    <td className="px-6 py-4 text-sm font-bold text-right whitespace-nowrap">
                      \${emp.netAmount.toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(emp.status)}`}>
                          <span className={`size-1.5 rounded-full ${getStatusDot(emp.status)}`}></span> 
                          {getStatusText(emp.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary hover:text-primary/80 transition-colors">
                        {getActionIcon(emp.status)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Breakdown of Discounts & Milestones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discounts */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" /> Distribución Descuentos Legales
            </h3>
            <div className="space-y-4">
              {mockPayrollSummary.descuentosDetails.map((desc, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{desc.name}</span>
                    <span className="font-bold">\${desc.amount.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`${desc.colorClass} h-full transition-all`} style={{ width: `${desc.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Milestones */}
          <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 shadow-sm flex flex-col justify-center">
            <h3 className="font-bold mb-6 flex items-center gap-2 text-primary">
              <CalendarDays className="w-5 h-5" /> Próximos Vencimientos
            </h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm shrink-0 font-bold">1</div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">Pago Previred</p>
                  <p className="text-sm text-slate-500 mt-1">Vence el 13 de Septiembre</p>
                </div>
              </li>
              <li className="flex items-start gap-4 opacity-60">
                <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-sm shrink-0 font-bold">2</div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">Declaración F29</p>
                  <p className="text-sm text-slate-500 mt-1">Vence el 20 de Septiembre</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}