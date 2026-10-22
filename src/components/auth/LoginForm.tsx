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
    <form action={formAction} className="space-y-4">
      <div className="flex flex-col">
        <label
          htmlFor="login-email"
          className="pb-1.5 text-[13px] font-medium text-[var(--color-muted)]"
        >
          Correo electrónico
        </label>
        <div className="relative">
          <User
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <input
            id="login-email"
            name="email"
            className="h-11 w-full rounded-lg border border-[#1c1512]/15 bg-white pl-10 pr-3 text-[14px] leading-normal text-[var(--color-ink)] transition-colors placeholder:text-[var(--color-muted)] hover:border-[#1c1512]/25 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            placeholder="correo@ejemplo.cl"
            type="email"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="flex flex-col">
        <label
          htmlFor="login-password"
          className="pb-1.5 text-[13px] font-medium text-[var(--color-muted)]"
        >
          Contraseña
        </label>
        <div className="relative">
          <Lock
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <input
            id="login-password"
            name="password"
            className="h-11 w-full rounded-lg border border-[#1c1512]/15 bg-white pl-10 pr-12 text-[14px] leading-normal text-[var(--color-ink)] transition-colors placeholder:text-[var(--color-muted)] hover:border-[#1c1512]/25 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
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
            className="absolute right-0 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="flex justify-end pt-1.5">
          <Link
            href="/forgot-password"
            className="rounded py-1 text-[13px] text-[var(--color-muted)] underline-offset-4 transition-colors hover:text-[var(--color-primary-ink)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            ¿Olvidó su contraseña?
          </Link>
        </div>
      </div>

      {state.status === "error" ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--color-negative)]/25 bg-[var(--color-negative-bg)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--color-negative-ink)]"
        >
          {state.message}
        </div>
      ) : null}

      <button
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--color-primary-ink)] disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isPending}
      >
        <span>{isPending ? "Ingresando…" : "Iniciar sesión"}</span>
        <LogIn className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
