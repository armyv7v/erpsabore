import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  const from = params.from ?? "ruta protegida";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 inline-flex rounded-2xl bg-orange-100 p-3 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Acceso denegado</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Tu perfil no tiene permisos para entrar a <span className="font-semibold">{from}</span>.
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Si necesitas ese acceso, un administrador debe ajustar tu rol o tus permisos operativos.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            Volver al inicio
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cambiar de usuario
          </Link>
        </div>
      </div>
    </div>
  );
}
