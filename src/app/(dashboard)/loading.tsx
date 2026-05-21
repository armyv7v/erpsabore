import React from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 p-8 animate-in fade-in duration-300">
      {/* Outer pulsing decoration */}
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing circle */}
        <div className="absolute size-16 rounded-full border border-primary/20 bg-primary/5 animate-ping opacity-75" />
        
        {/* Middle glassmorphic circle */}
        <div className="absolute size-14 rounded-full border border-slate-200/50 bg-white/20 dark:border-slate-800/50 dark:bg-slate-900/20 backdrop-blur-sm shadow-sm" />
        
        {/* Spinning loader */}
        <Loader2 className="relative w-8 h-8 text-primary animate-spin" />
      </div>
      
      {/* Text feedback */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wide animate-pulse">
          Cargando ERP Sabore
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          Preparando tu espacio de trabajo...
        </p>
      </div>
    </div>
  );
}
