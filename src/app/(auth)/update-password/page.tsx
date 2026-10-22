import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

export const metadata = {
  title: "Nueva contraseña | Saboré",
  description: "Defina su nueva contraseña.",
};

interface UpdatePasswordPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const { error } = await searchParams;

  let hasSession = false;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasSession = Boolean(user);
  } catch {
    hasSession = false;
  }

  const expired = error === "expired" || !hasSession;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-frame)] p-4 text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <div className="w-full max-w-[440px] rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6">
          <Link href="/login" className="inline-flex h-8 w-auto items-center gap-2">
            <img
              src="/brand/logo_camel_sin_fondo.png"
              alt="Saboré Insumos"
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>

        {expired ? (
          <div className="space-y-5">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Enlace expirado o inválido
            </h1>
            <div className="rounded-lg border border-[var(--color-negative)]/25 bg-[var(--color-negative-bg)] px-4 py-3 text-[13px] leading-relaxed text-[var(--color-negative-ink)]">
              <p>
                Este enlace de recuperación ya no es válido. Solicite uno nuevo para continuar.
              </p>
            </div>
            <Link
              href="/forgot-password"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--color-primary-ink)]"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Nueva contraseña
            </h1>
            <p className="mt-2 mb-6 text-sm leading-relaxed text-[var(--color-muted)]">
              Defina su nueva contraseña. Debe tener al menos 8 caracteres.
            </p>
            <UpdatePasswordForm />
          </>
        )}
      </div>
    </main>
  );
}
