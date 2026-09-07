"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, LogIn, User } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import type { ActionState } from "@/lib/types/erp";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex flex-col login-fade-3">
        <label
          htmlFor="login-email"
          className="text-[rgba(248,246,246,0.5)] text-xs font-bold uppercase tracking-[0.15em] pb-2 px-1"
        >
          Correo electrónico
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
          <input
            id="login-email"
            name="email"
            className="login-glass-input flex w-full rounded-xl h-14 pl-12 pr-4 text-base font-normal leading-normal"
            placeholder="correo@ejemplo.cl"
            type="email"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="flex flex-col login-fade-4">
        <label
          htmlFor="login-password"
          className="text-[rgba(248,246,246,0.5)] text-xs font-bold uppercase tracking-[0.15em] pb-2 px-1"
        >
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
          <input
            id="login-password"
            name="password"
            className="login-glass-input flex w-full rounded-xl h-14 pl-12 pr-14 text-base font-normal leading-normal"
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-primary/60 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex justify-end pt-2">
          <Link
            href="/forgot-password"
            className="rounded px-1 py-1 text-xs font-semibold text-primary/80 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            ¿Olvidaste tu contraseña?
          </Link>
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
