import React from 'react';
import { ArrowLeft, Search, Wand2, AccountBalance, Difference, CheckCircle2, Warning, QuestionMark, Link as LinkIcon, SearchOff, Bolt } from 'lucide-react';
import { mockBankStatements, mockERPRecords } from '@/data/reconciliation';

export default function ReconciliationPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Page Header Component */}
      <div className="border-b border-primary/20 bg-white dark:bg-slate-900/50 p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">Conciliación Bancaria</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" 
                placeholder="Buscar movimientos..." 
                type="text"
              />
            </div>
            <button className="w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <Wand2 className="w-4 h-4" />
              Auto-conciliar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 sm:gap-8 mt-6 overflow-x-auto no-scrollbar">
          <button className="py-2 border-b-2 border-primary text-primary font-bold text-sm whitespace-nowrap">Pendientes (24)</button>
          <button className="py-2 border-b-2 border-transparent text-slate-500 font-medium text-sm hover:text-primary transition-colors whitespace-nowrap">Conciliados</button>
          <button className="py-2 border-b-2 border-transparent text-slate-500 font-medium text-sm hover:text-primary transition-colors whitespace-nowrap">Discrepancias (3)</button>
        </div>
      </div>

      <main className="flex-1 p-4 lg:p-6 space-y-8 pb-24">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Saldo Extracto</p>
            <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-50">\$45.230,00</p>
            <div className="mt-2 flex items-center gap-1 text-green-600 text-xs font-medium">
              <AccountBalance className="w-3 h-3" />
              <span>Banco Santander • 4432</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Saldo ERP</p>
            <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-50">\$44.850,50</p>
            <div className="mt-2 flex items-center gap-1 text-primary text-xs font-semibold">
              <Difference className="w-3 h-3" />
              <span>Diferencia: -\$379,50</span>
            </div>
          </div>
          <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-primary">Progreso</p>
                <p className="text-xs text-primary/80">12 de 36 conciliados</p>
              </div>
              <span className="text-xl font-black text-primary">33%</span>
            </div>
            <div className="w-full bg-primary/20 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-primary h-full w-1/3"></div>
            </div>
          </div>
        </div>

        {/* Comparison View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          
          {/* Left Side: Bank Statements */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <AccountBalance className="text-blue-500 w-5 h-5" />
                Extracto Bancario
              </h3>
              <span className="text-xs text-slate-500">Actualizado: Hoy</span>
            </div>
            <div className="space-y-3">
              {mockBankStatements.map((row) => (
                <div 
                  key={row.id} 
                  className={`bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 shadow-sm hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer ${
                    row.status === 'matched' ? 'border-green-500' :
                    row.status === 'discrepancy' ? 'border-amber-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <p className="text-xs text-slate-500">{row.date}</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{row.concept}</p>
                      <p className="text-xs text-slate-500">{row.reference}</p>
                    </div>
                    <div className="sm:text-right flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                      <p className={`font-bold ${row.type === 'expense' ? 'text-red-500' : 'text-green-600'}`}>
                        {row.type === 'expense' ? '-' : '+'}\${row.amount.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full mt-1 ${
                        row.status === 'matched' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        row.status === 'discrepancy' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {row.status === 'matched' && <><CheckCircle2 className="w-3 h-3" /> Coincidencia</>}
                        {row.status === 'discrepancy' && <><Warning className="w-3 h-3" /> Sin registro ERP</>}
                        {row.status === 'pending' && <><QuestionMark className="w-3 h-3" /> Pendiente</>}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right Side: ERP Records */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <DatabaseIcon className="text-primary w-5 h-5" />
                Registros ERP
              </h3>
              <button className="text-xs text-primary font-bold hover:underline">+ Crear ajuste</button>
            </div>
            <div className="space-y-3">
              {mockERPRecords.map((erp) => {
                if (erp.isMissing) {
                  return (
                    <div key={erp.id} className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center py-6 opacity-60 h-[92px]">
                      <p className="text-xs font-medium text-slate-500 text-center px-4">No se encontró registro exacto</p>
                      <button className="mt-1 text-[10px] bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full font-bold hover:bg-primary/20 hover:text-primary transition-colors">Contabilizar ahora</button>
                    </div>
                  );
                }

                return (
                  <div 
                    key={erp.id} 
                    className={`bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 shadow-sm ${
                      erp.matchConfidence ? 'border-primary/30 hover:ring-1 hover:ring-primary/30 cursor-pointer' : 'border-green-500 ring-1 ring-primary/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div>
                        <p className="text-xs text-slate-500">{erp.date}</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{erp.concept}</p>
                        <p className="text-xs text-slate-500">{erp.reference}</p>
                      </div>
                      <div className="sm:text-right flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                        <p className={`font-bold ${erp.type === 'expense' ? 'text-red-500' : 'text-green-600'}`}>
                          {erp.type === 'expense' ? '-' : '+'}\${erp.amount.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                        </p>
                        <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full mt-1 ${
                          erp.matchConfidence ? 'bg-primary/10 text-primary' : 'text-green-600 bg-transparent'
                        }`}>
                          {erp.matchConfidence ? (
                            <><Bolt className="w-3 h-3" /> Sugerencia: {erp.matchConfidence}%</>
                          ) : (
                            <><LinkIcon className="w-3 h-3" /> Vinculado</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

// Minimal dummy icon for Database since lucide-react database might have different name
function DatabaseIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
      <path d="M3 12A9 3 0 0 0 21 12"></path>
    </svg>
  );
}