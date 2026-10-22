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

const inputClass =
  "h-11 w-full rounded-lg border border-[#1c1512]/15 bg-white pl-10 pr-12 text-[14px] leading-normal text-[var(--color-ink)] transition-colors placeholder:text-[var(--color-muted)] hover:border-[#1c1512]/25 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20";

const labelClass = "pb-1.5 text-[13px] font-medium text-[var(--color-muted)]";

const iconClass =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]";

export default function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  if (state.status === "success") {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-[var(--color-positive)]/25 bg-[var(--color-positive-bg)] px-4 py-3 text-[13px] text-[var(--color-positive-ink)]">
          <p className="font-semibold">Contraseña actualizada</p>
          <p className="mt-1">{state.message}</p>
        </div>
        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--color-primary-ink)]"
        >
          <span>Ir al inicio de sesión</span>
          <LogIn className="size-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-col">
        <label htmlFor="update-password" className={labelClass}>
          Nueva contraseña
        </label>
        <div className="relative">
          <Lock aria-hidden="true" className={iconClass} />
          <input
            id="update-password"
            name="password"
            className={inputClass}
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
            className="absolute right-0 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <label htmlFor="update-confirm" className={labelClass}>
          Confirmar contraseña
        </label>
        <div className="relative">
          <Lock aria-hidden="true" className={iconClass} />
          <input
            id="update-confirm"
            name="confirm"
            className={`${inputClass} pr-3`}
            placeholder="Repita su nueva contraseña"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
          />
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
        <span>{isPending ? "Actualizando…" : "Actualizar contraseña"}</span>
        <Lock className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
