"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { requestPasswordResetAction } from "@/app/actions/auth";
import type { ActionState } from "@/lib/types/erp";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

const inputClass =
  "h-11 w-full rounded-lg border border-[#1c1512]/15 bg-white pl-10 pr-3 text-[14px] leading-normal text-[var(--color-ink)] transition-colors placeholder:text-[var(--color-muted)] hover:border-[#1c1512]/25 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20";

const linkClass =
  "rounded py-1 text-[13px] text-[var(--color-muted)] underline-offset-4 transition-colors hover:text-[var(--color-primary-ink)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]";

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);

  if (state.status === "success") {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-[var(--color-positive)]/25 bg-[var(--color-positive-bg)] px-4 py-3 text-[13px] text-[var(--color-positive-ink)]">
          <p className="font-semibold">Revise su correo</p>
          <p className="mt-1">{state.message}</p>
        </div>
        <div className="flex justify-center">
          <Link href="/login" className={linkClass}>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-col">
        <label
          htmlFor="forgot-email"
          className="pb-1.5 text-[13px] font-medium text-[var(--color-muted)]"
        >
          Correo electrónico
        </label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <input
            id="forgot-email"
            name="email"
            className={inputClass}
            placeholder="correo@ejemplo.cl"
            type="email"
            autoComplete="email"
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
        <span>{isPending ? "Enviando…" : "Enviar enlace de recuperación"}</span>
        <Send className="size-4" aria-hidden="true" />
      </button>

      <div className="flex justify-center">
        <Link href="/login" className={linkClass}>
          Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}
