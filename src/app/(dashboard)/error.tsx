"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-6">
      <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Error al cargar esta sección
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ocurrió un problema al obtener los datos. Puede ser temporal — intentá
          recargar.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono">
            ref: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  );
}
