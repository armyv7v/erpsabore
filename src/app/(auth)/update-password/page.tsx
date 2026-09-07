import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

export const metadata = {
  title: "Nueva contraseña | Saboré",
  description: "Definí tu nueva contraseña.",
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
    <main className="min-h-screen bg-[#1c110b] text-[#f8f6f6] flex items-center justify-center p-4">
      <div className="login-glass-card rounded-3xl p-8 w-full max-w-[480px] login-fade-2 relative overflow-hidden">
        <div className="mb-6 login-fade-1">
          <Link href="/login" className="inline-flex items-center gap-2 h-8 w-auto">
            <img
              src="/brand/logo_blanco_sin_fondo.png"
              alt="Saboré Insumos"
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>

        {expired ? (
          <div className="space-y-5 login-fade-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Enlace expirado o inválido
            </h1>
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-300">
              <p>
                Este enlace de recuperación ya no es válido. Solicitá uno nuevo para continuar.
              </p>
            </div>
            <div className="pt-2 login-fade-5">
              <Link
                href="/forgot-password"
                className="login-cta-btn w-full text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 group"
              >
                <span>Solicitar nuevo enlace</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="login-fade-2 text-2xl sm:text-3xl font-black tracking-tight mb-3">
              Nueva contraseña
            </h1>
            <p className="login-fade-3 text-[rgba(248,246,246,0.7)] text-sm leading-relaxed mb-8">
              Definí tu nueva contraseña. Debe tener al menos 8 caracteres.
            </p>
            <UpdatePasswordForm />
          </>
        )}
      </div>
    </main>
  );
}
