"use client";

import { useActionState } from "react";
import { Lock, LogIn, User } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import type { ActionState } from "@/lib/types/erp";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex flex-col login-fade-3">
        <label className="text-[rgba(248,246,246,0.5)] text-xs font-bold uppercase tracking-[0.15em] pb-2 px-1">
          Correo electrónico
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
          <input
            name="email"
            className="login-glass-input flex w-full rounded-xl h-14 pl-12 pr-4 text-base font-normal leading-normal"
            placeholder="correo@ejemplo.cl"
            type="email"
            required
          />
        </div>
      </div>

      <div className="flex flex-col login-fade-4">
        <label className="text-[rgba(248,246,246,0.5)] text-xs font-bold uppercase tracking-[0.15em] pb-2 px-1">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
          <input
            name="password"
            className="login-glass-input flex w-full rounded-xl h-14 pl-12 pr-4 text-base font-normal leading-normal"
            placeholder="••••••••"
            type="password"
            required
          />
        </div>
      </div>

      {state.status === "error" ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 login-fade-5">
          {state.message}
        </div>
      ) : null}

      <div className="pt-2 login-fade-5">
        <button
          className="login-cta-btn w-full text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 group disabled:opacity-70"
          type="submit"
          disabled={isPending}
        >
          <span>{isPending ? "Ingresando..." : "Iniciar sesión"}</span>
          <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </form>
  );
}
