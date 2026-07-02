import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import RegisterForm from "@/components/auth/RegisterForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function RegisterPage() {
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
              <span className="text-primary text-xs font-bold uppercase tracking-wider">Clientes</span>
            </div>
          </div>

          <div className="px-6 py-4">
            <div
              className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-primary/5 rounded-xl min-h-[140px] border border-primary/10"
              style={{ backgroundImage: 'url("/brand/banner_web.png")' }}
            />
          </div>

          <div className="px-6">
            <h2 className="text-slate-900 dark:text-white tracking-tight text-2xl font-bold leading-tight pb-1 pt-4">
              Registro de Clientes
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal pb-6">
              Cree su cuenta de cliente para consultar precios, stock y gestionar despachos.
            </p>

            {!isSupabaseConfigured() && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                Falta configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
              </div>
            )}

            <RegisterForm />

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-405">
                ¿Ya tiene una cuenta?{" "}
                <Link href="/login" className="text-primary hover:underline font-semibold">
                  Inicie sesión aquí
                </Link>
              </p>
            </div>

            <div className="mt-6 py-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <Shield className="text-green-500 w-4 h-4" />
                <p className="text-[11px]">Conexión segura y encriptada.</p>
              </div>
            </div>

            <div className="py-6 text-center">
              <p className="text-slate-400 dark:text-slate-500 text-xxs">
                Al registrarse, acepta los <Link href="#" className="underline">términos de servicio</Link> y las <Link href="#" className="underline">políticas de privacidad</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}