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

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);

  if (state.status === "success") {
    return (
      <div className="space-y-5 login-fade-3">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
          <p className="font-semibold">Revisá tu correo</p>
          <p className="mt-1 text-emerald-200/80">{state.message}</p>
        </div>
        <div className="text-center">
          <Link
            href="/login"
            className="rounded px-1 py-1 text-xs font-semibold text-primary/80 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex flex-col login-fade-3">
        <label
          htmlFor="forgot-email"
          className="text-[rgba(248,246,246,0.5)] text-xs font-bold uppercase tracking-[0.15em] pb-2 px-1"
        >
          Correo electrónico
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
          <input
            id="forgot-email"
            name="email"
            className="login-glass-input flex w-full rounded-xl h-14 pl-12 pr-4 text-base font-normal leading-normal"
            placeholder="correo@ejemplo.cl"
            type="email"
            autoComplete="email"
            required
          />
        </div>
      </div>

      {state.status === "error" ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 login-fade-4">
          {state.message}
        </div>
      ) : null}

      <div className="pt-2 login-fade-5">
        <button
          className="login-cta-btn w-full text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 group disabled:opacity-70"
          type="submit"
          disabled={isPending}
        >
          <span>{isPending ? "Enviando..." : "Enviar enlace de recuperación"}</span>
          <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="text-center">
        <Link
          href="/login"
          className="rounded px-1 py-1 text-xs font-semibold text-primary/80 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}
