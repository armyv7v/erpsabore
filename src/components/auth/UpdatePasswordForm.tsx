"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, LogIn } from "lucide-react";
import { updatePasswordAction } from "@/app/actions/auth";
import type { ActionState } from "@/lib/types/erp";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export default function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  if (state.status === "success") {
    return (
      <div className="space-y-5 login-fade-3">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
          <p className="font-semibold">Contraseña actualizada</p>
          <p className="mt-1 text-emerald-200/80">{state.message}</p>
        </div>
        <div className="pt-2 login-fade-5">
          <Link
            href="/login"
            className="login-cta-btn w-full text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 group"
          >
            <span>Ir al inicio de sesión</span>
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex flex-col login-fade-3">
        <label
          htmlFor="update-password"
          className="text-[rgba(248,246,246,0.5)] text-xs font-bold uppercase tracking-[0.15em] pb-2 px-1"
        >
          Nueva contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
          <input
            id="update-password"
            name="password"
            className="login-glass-input flex w-full rounded-xl h-14 pl-12 pr-14 text-base font-normal leading-normal"
            placeholder="Mínimo 8 caracteres"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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
      </div>

      <div className="flex flex-col login-fade-4">
        <label
          htmlFor="update-confirm"
          className="text-[rgba(248,246,246,0.5)] text-xs font-bold uppercase tracking-[0.15em] pb-2 px-1"
        >
          Confirmar contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
          <input
            id="update-confirm"
            name="confirm"
            className="login-glass-input flex w-full rounded-xl h-14 pl-12 pr-4 text-base font-normal leading-normal"
            placeholder="Repetí tu nueva contraseña"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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
          <span>{isPending ? "Actualizando..." : "Actualizar contraseña"}</span>
          <Lock className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </form>
  );
}
