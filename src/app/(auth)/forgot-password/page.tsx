import Link from "next/link";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Recuperar contraseña | Saboré",
  description: "Solicite un enlace para restablecer su contraseña.",
};

export default function ForgotPasswordPage() {
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

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Recuperar contraseña
        </h1>
        <p className="mt-2 mb-6 text-sm leading-relaxed text-[var(--color-muted)]">
          Ingrese su correo y le enviaremos un enlace para restablecer su contraseña.
        </p>

        <ForgotPasswordForm />
      </div>
    </main>
  );
}
