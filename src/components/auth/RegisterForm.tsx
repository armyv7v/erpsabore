"use client";

import { useActionState, useState } from "react";
import { Lock, LogIn, Mail, User, ShieldAlert, Chrome } from "lucide-react";
import { registerClientAction } from "@/app/actions/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ActionState } from "@/lib/types/erp";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerClientAction, initialState);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      setOauthError(null);
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=cliente`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setOauthError(
        err?.message === "Unsupported provider: provider is not enabled"
          ? "El inicio de sesión con Google no está habilitado en la consola de Supabase."
          : err?.message || "Ocurrió un error al conectar con Google."
      );
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        {/* Nombre */}
        <div className="flex flex-col">
          <label className="text-slate-700 dark:text-slate-350 text-sm font-semibold pb-1.5 px-1">
            Nombre completo
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              name="fullName"
              className="form-input flex w-full rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 pl-12 pr-4 text-sm font-medium transition-all"
              placeholder="Ej: Rodrigo Valdés"
              type="text"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col">
          <label className="text-slate-700 dark:text-slate-350 text-sm font-semibold pb-1.5 px-1">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              name="email"
              className="form-input flex w-full rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 pl-12 pr-4 text-sm font-medium transition-all"
              placeholder="correo@ejemplo.cl"
              type="email"
              required
            />
          </div>
        </div>

        {/* RUT */}
        <div className="flex flex-col">
          <label className="text-slate-700 dark:text-slate-350 text-sm font-semibold pb-1.5 px-1">
            RUT / DNI
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              name="rut"
              className="form-input flex w-full rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 pl-12 pr-4 text-sm font-medium transition-all"
              placeholder="Ej: 19.876.543-2"
              type="text"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <label className="text-slate-700 dark:text-slate-350 text-sm font-semibold pb-1.5 px-1">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              name="password"
              className="form-input flex w-full rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 pl-12 pr-4 text-sm font-medium transition-all"
              placeholder="Mínimo 8 caracteres"
              type="password"
              required
            />
          </div>
        </div>

        {state.status === "error" && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-xs text-red-700 dark:text-red-400 flex items-start gap-2 animate-fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{state.message}</span>
          </div>
        )}

        <div className="pt-2">
          <button
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 text-sm"
            type="submit"
            disabled={isPending || isGoogleLoading}
          >
            <span>{isPending ? "Creando cuenta..." : "Registrarse como cliente"}</span>
            <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">o</span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
      </div>

      {oauthError && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-xs text-red-700 dark:text-red-400 flex items-start gap-2 animate-fade-in mb-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{oauthError}</span>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isPending || isGoogleLoading}
          className="w-full bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-250 dark:border-slate-850 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm disabled:opacity-75"
        >
          <Chrome className="w-4 h-4 text-red-500 shrink-0" />
          <span>{isGoogleLoading ? "Conectando con Google..." : "Registrarse con Google"}</span>
        </button>
      </div>
    </div>
  );
}