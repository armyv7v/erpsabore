"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  ShoppingBag,
  Truck,
  Tag,
  Star,
  Building2,
  Shield,
} from "lucide-react";

const BENEFITS = [
  { icon: Tag, label: "Precios por mayor y detalle" },
  { icon: Truck, label: "Despacho logístico coordinado" },
  { icon: Shield, label: "Grado alimentario certificado" },
  { icon: Star, label: "Atención personalizada" },
];

export default function LivingLandingClient() {
  const [loginMode, setLoginMode] = useState<"client" | "erp">("client");

  return (
    <main className="min-h-screen bg-[#f3f2f0] text-[#1c1512]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1240px] flex-col px-5 py-6 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between gap-4 border-b border-[#e3dfd9] pb-5">
          <Image
            src="/brand/logo_negro_sin_fondo.png"
            alt="Saboré Insumos y Suministros"
            width={186}
            height={44}
            className="h-9 w-auto object-contain sm:h-10"
            priority
          />
          <Link
            href="/catalogo"
            className="hidden text-[13px] font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)] sm:inline"
          >
            Ver catálogo público
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_392px] lg:gap-16 lg:py-12">
          {/* ═══ Presentación ═══ */}
          <section className="max-w-[560px]">
            <p className="text-[13px] font-medium text-[var(--color-primary-ink)]">
              Insumos y suministros gastronómicos
            </p>

            <h1 className="mt-3 text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] text-balance sm:text-[30px] lg:text-[32px]">
              Todo lo que su negocio necesita.
            </h1>

            <p className="mt-4 max-w-[46ch] text-[14px] leading-relaxed text-[var(--color-muted)]">
              Catálogo con precios por mayor y detalle, listas guardadas y despacho
              coordinado a su local. Si ya es cliente, ingrese con su correo corporativo.
            </p>

            <ul className="mt-8 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {BENEFITS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5">
                  <Icon
                    className="size-4 shrink-0 text-[var(--color-primary-ink)]"
                    aria-hidden="true"
                  />
                  <span className="text-[13px] leading-snug">{label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--color-primary-ink)]"
              >
                <ShoppingBag className="size-4" aria-hidden="true" />
                Ver catálogo completo
              </Link>
            </div>
          </section>

          {/* ═══ Acceso ═══ */}
          <section
            id="login-node"
            aria-labelledby="login-title"
            className="mx-auto w-full max-w-[440px] rounded-2xl border border-[#e3dfd9] bg-white p-5 sm:p-6 lg:mx-0 lg:max-w-none"
          >
            <div
              className="grid grid-cols-2 gap-1 rounded-xl bg-[#f3f2f0] p-1"
              role="tablist"
              aria-label="Tipo de acceso"
            >
              <button
                type="button"
                role="tab"
                aria-selected={loginMode === "client"}
                onClick={() => setLoginMode("client")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-semibold transition-colors ${
                  loginMode === "client"
                    ? "bg-white text-[var(--color-ink)] shadow-[0_1px_0_rgba(28,21,18,0.06)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                <ShoppingBag className="size-3.5" aria-hidden="true" />
                Portal clientes
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={loginMode === "erp"}
                onClick={() => setLoginMode("erp")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-semibold transition-colors ${
                  loginMode === "erp"
                    ? "bg-white text-[var(--color-ink)] shadow-[0_1px_0_rgba(28,21,18,0.06)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                <Building2 className="size-3.5" aria-hidden="true" />
                Acceso ERP
              </button>
            </div>

            <div className="mt-5">
              <h2 id="login-title" className="text-[17px] font-semibold leading-tight">
                {loginMode === "client" ? "Acceso a clientes" : "Acceso administrativo"}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">
                {loginMode === "client"
                  ? "Ingrese con su correo corporativo para ver tarifas preferenciales y coordinar despachos."
                  : "Módulo de administración: facturación, inventario y reportería interna."}
              </p>
            </div>

            {!isSupabaseConfigured() ? (
              <div className="mt-4 rounded-lg border border-[var(--color-warning-ink)]/30 bg-[var(--color-warning-bg)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--color-warning-ink)]">
                Falta configurar{" "}
                <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
                <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
              </div>
            ) : null}

            <div className="mt-5">
              <LoginForm />
            </div>

            {loginMode === "client" ? (
              <div className="mt-5 space-y-2 border-t border-[#e3dfd9] pt-4">
                <p className="text-center text-[13px] text-[var(--color-muted)]">
                  ¿Primera vez comprando con nosotros?
                </p>
                <Link
                  href="/registro"
                  className="block w-full rounded-lg border border-[#d8d2c9] py-2.5 text-center text-[13px] font-semibold transition-colors hover:border-[#b9b1a6]"
                >
                  Crear cuenta de cliente
                </Link>
                <Link
                  href="/catalogo"
                  className="block w-full rounded-lg py-2.5 text-center text-[13px] font-medium text-[var(--color-primary-ink)] transition-colors hover:underline"
                >
                  Entrar como invitado al catálogo
                </Link>
              </div>
            ) : (
              <p className="mt-5 border-t border-[#e3dfd9] pt-4 text-[13px] leading-relaxed text-[var(--color-muted)]">
                El acceso administrativo requiere credenciales autorizadas con doble factor.
              </p>
            )}
          </section>
        </div>

        <footer className="flex flex-col gap-2 border-t border-[#e3dfd9] pt-5 text-[12px] leading-relaxed text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Saboré Insumos y Suministros</span>
          <span className="max-w-[62ch] sm:text-right">
            Al ingresar confirma su adhesión a las políticas de seguridad y protección de
            datos comerciales.
          </span>
        </footer>
      </div>
    </main>
  );
}
