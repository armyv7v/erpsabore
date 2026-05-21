import React from "react";
import Link from "next/link";
import { FileText, Shield, ShieldCheck } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminLogin() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="relative flex h-auto w-full flex-col bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary w-8 h-8" />
              <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                ERP Sabore
              </h2>
            </div>
            <div className="px-3 py-1 bg-primary/10 rounded-full">
              <span className="text-primary text-xs font-bold uppercase tracking-wider">v1 real</span>
            </div>
          </div>

          <div className="px-6 py-4">
            <div
              className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-primary/5 rounded-xl min-h-[160px] border border-primary/10"
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCcR1j7X37a239zGAVXoQrOX-COgrmeo-Ial0ay46z4eL9CuXQb44KilNwvTMFCBAmTkBDAXdACl7Qt05Hc66TmTjVTcpU4QlvH6_h6LR3uDD3Sru3l0EERWmjUG4ibmj4svSo5iZ3q_qFeRA7RZmuOjt1cRXfXvThrNrVOCYHJWeHbT3StDU_uvrDCBUMGEFRgajS8HEmOn3kZu_upQWsO5HS2cy5YCb-4b_fhxtp2jwNggt-MELHfWjPtIOMd1V_PZZHIIPrf8MA")' }}
            />
          </div>

          <div className="px-6">
            <h2 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight pb-2 pt-4">
              Acceso Seguro ERP
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal pb-6">
              Inicia sesión para operar ventas, facturación y finanzas sobre la capa real de datos.
            </p>

            {!isSupabaseConfigured() ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Falta configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
              </div>
            ) : null}

            <LoginForm />

            <div className="mt-8 py-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <Shield className="text-green-500 w-4 h-4" />
                <p className="text-xs">Autenticación SSR con Supabase Auth y middleware de sesión.</p>
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mt-3">
                <FileText className="text-primary w-4 h-4" />
                <p className="text-xs">La app ya soporta perfiles, roles y tenant único listo para crecer.</p>
              </div>
            </div>

            <div className="py-6 text-center">
              <p className="text-slate-400 dark:text-slate-500 text-xs">
                Al ingresar, aceptas la <Link href="#" className="underline">política del sistema</Link> y los <Link href="#" className="underline">protocolos de seguridad</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
