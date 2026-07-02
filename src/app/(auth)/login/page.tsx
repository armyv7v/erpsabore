import React from "react";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminLogin() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="relative flex h-auto w-full flex-col bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-2 h-10">
              <picture className="block h-8 w-auto">
                <source srcSet="/brand/logo_blanco_sin_fondo.png" media="(prefers-color-scheme: dark)" />
                <img
                  src="/brand/logo_camel_sin_fondo.png"
                  alt="Saboré Insumos"
                  className="h-8 w-auto object-contain"
                />
              </picture>
            </div>
            <div className="px-3 py-1 bg-primary/10 rounded-full">
              <span className="text-primary text-xs font-bold uppercase tracking-wider">v1 real</span>
            </div>
          </div>

          <div className="px-6 py-4">
            <div
              className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-primary/5 rounded-xl min-h-[160px] border border-primary/10"
              style={{ backgroundImage: 'url("/brand/banner_web.png")' }}
            />
          </div>

          <div className="px-6">
            <h2 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight pb-2 pt-4">
              Acceso Seguro ERP
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal pb-6">
              Inicie sesión para acceder al sistema.
            </p>

            {!isSupabaseConfigured() ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Falta configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
              </div>
            ) : null}

            <LoginForm />

            <div className="mt-4 text-center pb-6">
              <p className="text-sm text-slate-600 dark:text-slate-405">
                ¿Es cliente?{" "}
                <Link href="/registro" className="text-primary hover:underline font-semibold">
                  Regístrese aquí
                </Link>
              </p>
            </div>

            <div className="py-6 text-center border-t border-slate-200 dark:border-slate-800">
              <p className="text-slate-400 dark:text-slate-500 text-xs">
                Al ingresar, acepta la <Link href="#" className="underline">política del sistema</Link> y los <Link href="#" className="underline">protocolos de seguridad</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
