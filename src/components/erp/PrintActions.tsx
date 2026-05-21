"use client";

import React from "react";
import { Printer, ArrowLeft } from "lucide-react";

export default function PrintActions() {
  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="fixed top-4 right-4 flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 print:hidden animate-fade-in">
      <button
        onClick={handleClose}
        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver
      </button>
      
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
      >
        <Printer className="h-4 w-4" />
        Imprimir DTE (PDF)
      </button>
    </div>
  );
}
