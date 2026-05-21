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
    <form action={formAction} className="space-y-4">
      <div className="flex flex-col">
        <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold leading-normal pb-2 px-1">
          Email
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            name="email"
            className="form-input flex w-full rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-14 placeholder:text-slate-400 pl-12 pr-4 text-base font-normal leading-normal transition-all"
            placeholder="admin@empresa.cl"
            type="email"
            required
          />
        </div>
      </div>

      <div className="flex flex-col">
        <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold pb-2 px-1">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            name="password"
            className="form-input flex w-full rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-14 placeholder:text-slate-400 pl-12 pr-4 text-base font-normal leading-normal transition-all"
            placeholder="Ingresa tu contraseña"
            type="password"
            required
          />
        </div>
      </div>

      {state.status === "error" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}

      <div className="pt-4">
        <button
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
          type="submit"
          disabled={isPending}
        >
          <span>{isPending ? "Ingresando..." : "Ingresar al ERP"}</span>
          <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </form>
  );
}
