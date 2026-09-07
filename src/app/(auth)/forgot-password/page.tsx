import Link from "next/link";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Recuperar contraseña | Saboré",
  description: "Solicitá un enlace para restablecer tu contraseña.",
};

export default function ForgotPasswordPage() {
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

        <h1 className="login-fade-2 text-2xl sm:text-3xl font-black tracking-tight mb-3">
          Recuperar contraseña
        </h1>
        <p className="login-fade-3 text-[rgba(248,246,246,0.7)] text-sm leading-relaxed mb-8">
          Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <ForgotPasswordForm />
      </div>
    </main>
  );
}
