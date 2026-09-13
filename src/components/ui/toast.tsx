"use client";

/**
 * Toasts accesibles sin contexto de React: showToast() despacha un CustomEvent
 * desde cualquier módulo cliente (utils incluidos) y un único <ToastHost/>
 * montado en el shell las renderiza. Reemplaza a los alert() nativos
 * (audit 2026-09-13, E2/E5 y Peak-End).
 */
import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export type ToastKind = "success" | "error" | "info";

const TOAST_EVENT = "ux-toast";

export interface ToastPayload {
  message: string;
  kind?: ToastKind;
  duration?: number;
}

export function showToast(message: string, kind: ToastKind = "success", duration = 4500) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: { message, kind, duration } }));
}

interface ToastItem extends Required<Pick<ToastPayload, "message" | "kind" | "duration">> {
  id: number;
}

const KIND_STYLES: Record<ToastKind, { border: string; icon: React.ReactNode }> = {
  success: { border: "border-green-200 dark:border-green-900/50", icon: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> },
  error: { border: "border-red-200 dark:border-red-900/50", icon: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" /> },
  info: { border: "border-slate-200 dark:border-slate-700", icon: <Info className="w-5 h-5 text-primary shrink-0" /> },
};

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    let counter = 0;
    function onToast(event: Event) {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      if (!detail?.message) return;
      const id = ++counter;
      setToasts((prev) => [
        ...prev,
        { id, message: detail.message, kind: detail.kind ?? "info", duration: detail.duration ?? 4500 },
      ]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, detail.duration ?? 4500);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 w-[min(92vw,360px)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`animate-in slide-in-from-bottom-2 fade-in duration-200 flex items-start gap-2.5 rounded-xl border bg-white dark:bg-slate-900 shadow-xl p-3.5 text-sm font-medium text-slate-800 dark:text-slate-100 ${KIND_STYLES[toast.kind].border}`}
        >
          {KIND_STYLES[toast.kind].icon}
          <span className="min-w-0 break-words">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
