"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import BioOrganismCanvas from "@/components/canvas/BioOrganismCanvas";
import LivingFloatingBackground from "@/components/canvas/LivingFloatingBackground";
import LivingCursor from "@/components/cursor/LivingCursor";
import LivingProductShowcase from "@/components/landing/LivingProductShowcase";
import { sound } from "@/components/audio/SoundEngine";
import {
  ShoppingBag,
  Truck,
  Tag,
  Star,
  Building2,
  Volume2,
  VolumeX,
  ArrowDown,
  Shield,
  Zap,
  Box,
} from "lucide-react";

export default function LivingLandingClient() {
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [loginMode, setLoginMode] = useState<"client" | "erp">("client");

  useEffect(() => {
    setIsAudioMuted(sound.getMuted());
  }, []);

  const handleAudioToggle = () => {
    const muted = sound.toggleMute();
    setIsAudioMuted(muted);
  };

  const scrollToSection = (id: string) => {
    sound.playClick(560);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-[#1c110b] text-[#f8f6f6] selection:bg-primary selection:text-white relative overflow-x-hidden">
      {/* ═══ Living Background Layer (Canvas + Organic Floating Specimen Matrix) ═══ */}
      <BioOrganismCanvas />
      <LivingFloatingBackground />
      <LivingCursor />

      {/* ═══ Ambient Audio Controls Top Floating Pill ═══ */}
      <header className="fixed top-6 right-6 z-40 flex items-center gap-3">
        <button
          onClick={handleAudioToggle}
          onMouseEnter={() => sound.playHover(500)}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-full border backdrop-blur-xl transition-all duration-300 text-xs font-semibold ${
            !isAudioMuted
              ? "bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(188,122,58,0.5)]"
              : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
          }`}
          aria-label="Alternar audio ambiental adaptativo"
        >
          {!isAudioMuted ? (
            <>
              <Volume2 className="w-4 h-4 text-primary animate-pulse" />
              <span className="hidden sm:inline">Bio-Audio Activo</span>
              <span className="flex gap-0.5 items-end h-3">
                <span className="w-0.5 h-3 bg-primary animate-bounce" />
                <span className="w-0.5 h-2 bg-primary animate-bounce delay-75" />
                <span className="w-0.5 h-2.5 bg-primary animate-bounce delay-150" />
              </span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
              <span className="hidden sm:inline">Audio Silenciado</span>
            </>
          )}
        </button>
      </header>

      {/* ══════════════════════════════════════════════════════
          HERO & PORTAL SECTION (Split 3D Matrix)
         ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col lg:flex-row items-stretch justify-between p-6 sm:p-10 lg:p-16 z-10">
        {/* Subtle dynamic grid matrix */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 -z-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(188,122,58,0.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(188,122,58,0.12) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />

        {/* ══════ LEFT: Hero Digital Organism ══════ */}
        <div className="relative flex-1 flex flex-col justify-between py-6 lg:py-8 lg:pr-12 max-w-3xl z-10">
          {/* Top Live Telemetry Badge */}
          <div className="flex items-center gap-3 mb-8 login-fade-1">
            <div className="login-dot-live" />
            <span className="text-xs tracking-wider uppercase font-semibold text-primary/90 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full backdrop-blur-md">
              Ecosistema Operativo • Saboré Insumos
            </span>
          </div>

          {/* Main Hero Kinetic Copy */}
          <div className="my-auto z-10 py-6">
            {/* Brand Logo with Glow */}
            <div className="mb-6 login-fade-1">
              <Image
                src="/brand/logo_blanco_sin_fondo.png"
                alt="Saboré Insumos y Suministros"
                width={210}
                height={50}
                className="h-12 w-auto object-contain drop-shadow-[0_0_20px_rgba(188,122,58,0.4)]"
                priority
              />
            </div>

            <p className="login-fade-1 text-primary text-xs font-black uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              Insumos & Suministros Gastronómicos
            </p>

            <h1 className="login-fade-2 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.04] tracking-tight mb-6 drop-shadow-md">
              Todo lo que
              <br />
              su negocio
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#E6A868] to-primary">
                necesita.
              </span>
            </h1>

            <p className="login-fade-3 text-[rgba(248,246,246,0.7)] text-base sm:text-lg leading-relaxed mb-8 max-w-xl backdrop-blur-[1px]">
              Acceda al catálogo interactivo en tiempo real, gestione listas de precios,
              coordine despachos y ordene suministros gastronómicos de alto rendimiento.
            </p>

            {/* Glowing Separator */}
            <div className="login-glow-line w-full mb-8 login-fade-4" />

            {/* Kinetic Benefit Nodes */}
            <div className="flex flex-wrap gap-3 login-fade-5 mb-8">
              <div
                onMouseEnter={() => sound.playHover(460)}
                className="login-feature-pill flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold backdrop-blur-md"
              >
                <Tag className="w-4 h-4 text-primary" />
                <span>Precios por Mayor y Detalle</span>
              </div>
              <div
                onMouseEnter={() => sound.playHover(500)}
                className="login-feature-pill flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold backdrop-blur-md"
              >
                <Truck className="w-4 h-4 text-primary" />
                <span>Despacho Logístico Coordinado</span>
              </div>
              <div
                onMouseEnter={() => sound.playHover(540)}
                className="login-feature-pill flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold backdrop-blur-md"
              >
                <Shield className="w-4 h-4 text-primary" />
                <span>Grado Alimentario Certificado</span>
              </div>
              <div
                onMouseEnter={() => sound.playHover(580)}
                className="login-feature-pill flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold backdrop-blur-md"
              >
                <Star className="w-4 h-4 text-primary" />
                <span>Atención Personalizada</span>
              </div>
            </div>

            {/* Navigation CTA Triggers */}
            <div className="flex flex-wrap items-center gap-4 login-fade-6">
              <button
                onClick={() => scrollToSection("showcase-section")}
                className="px-6 py-3.5 rounded-xl bg-white/5 border border-primary/30 text-white font-bold text-sm hover:bg-primary/10 hover:border-primary transition-all flex items-center gap-2 group backdrop-blur-md shadow-lg"
              >
                <Box className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span>Explorar Ecosistema 3D</span>
                <ArrowDown className="w-4 h-4 text-primary/70 group-hover:translate-y-1 transition-transform" />
              </button>

              <Link
                href="/catalogo"
                onClick={() => sound.playClick(640)}
                onMouseEnter={() => sound.playHover(520)}
                className="px-6 py-3.5 rounded-xl bg-primary text-white font-bold text-sm shadow-[0_0_25px_rgba(188,122,58,0.4)] hover:bg-[#d4944e] transition-all flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Ver Catálogo Completo</span>
              </Link>
            </div>
          </div>

          {/* Footer Telemetry Stamp */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-white/30 login-fade-6">
            <span>© {new Date().getFullYear()} Saboré Insumos y Suministros</span>
            <span className="hidden sm:inline">Engine v2.4 • Bio-Reactive Interface</span>
          </div>
        </div>

        {/* ══════ RIGHT: Biomorphic Quantum Login Portal ══════ */}
        <div
          id="login-node"
          className="relative flex items-center justify-center py-8 lg:py-0 lg:w-[480px] xl:w-[520px] z-20"
        >
          {/* Ambient Portal Halo */}
          <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl pointer-events-none" />

          <div className="relative w-full max-w-[430px]">
            {/* Mode Switcher: Clientes vs ERP */}
            <div className="flex rounded-2xl bg-black/40 border border-primary/20 p-1.5 mb-4 backdrop-blur-xl login-fade-1">
              <button
                type="button"
                onClick={() => {
                  sound.playClick(500);
                  setLoginMode("client");
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  loginMode === "client"
                    ? "bg-primary text-white shadow-[0_0_15px_rgba(188,122,58,0.5)]"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Portal Clientes</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick(600);
                  setLoginMode("erp");
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  loginMode === "erp"
                    ? "bg-[#42431C] text-white shadow-[0_0_15px_rgba(66,67,28,0.6)]"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Acceso ERP</span>
              </button>
            </div>

            {/* Glassmorphic Login Matrix Card */}
            <div className="login-glass-card rounded-3xl p-8 login-fade-2 relative overflow-hidden">
              {/* Internal Accent Glow */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_15px_rgba(188,122,58,0.3)]">
                  {loginMode === "client" ? (
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  ) : (
                    <Building2 className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold">
                    {loginMode === "client" ? "Acceso a Clientes" : "Acceso Administrativo ERP"}
                  </h2>
                  <span className="text-[11px] text-primary/80 font-semibold uppercase tracking-wider">
                    {loginMode === "client" ? "Catálogo & Pedidos" : "Gestión & Inventario"}
                  </span>
                </div>
              </div>

              <p className="text-[rgba(248,246,246,0.5)] text-xs sm:text-sm mb-6 leading-relaxed">
                {loginMode === "client"
                  ? "Ingrese con su correo corporativo para acceder a tarifas preferenciales y despacho coordinado."
                  : "Módulo seguro de administración, facturación DTE, control de stock y reportería interna."}
              </p>

              {!isSupabaseConfigured() ? (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
                  Falta configurar <code className="text-amber-200">NEXT_PUBLIC_SUPABASE_URL</code> y <code className="text-amber-200">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
                </div>
              ) : null}

              {/* LoginForm Component */}
              <LoginForm />

              {/* Client Registration & Instant Guest Catalog Access */}
              {loginMode === "client" ? (
                <div className="mt-6 pt-5 border-t border-[rgba(188,122,58,0.15)] space-y-3 login-fade-5">
                  <p className="text-[rgba(248,246,246,0.5)] text-xs text-center font-medium">
                    ¿Primera vez adquiriendo insumos?
                  </p>
                  <Link
                    href="/registro"
                    onClick={() => sound.playClick(620)}
                    className="block w-full text-center py-3 rounded-xl border border-primary/40 text-primary font-bold text-xs hover:bg-primary/10 hover:border-primary transition-all"
                  >
                    Crear cuenta de cliente nuevo
                  </Link>
                  <Link
                    href="/catalogo"
                    onClick={() => sound.playClick(680)}
                    className="block w-full text-center py-3 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary border border-primary/25 font-bold text-xs transition-all hover:scale-[1.01]"
                  >
                    Ingresar como invitado (Ver catálogo sin login)
                  </Link>
                </div>
              ) : (
                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                  <p className="text-white/40 text-xs">
                    El acceso administrativo requiere credenciales autorizadas con doble factor.
                  </p>
                </div>
              )}

              {/* Forgot password */}
              <div className="mt-4 text-center">
                <Link
                  href="/forgot-password"
                  onClick={() => sound.playClick(400)}
                  className="text-[rgba(248,246,246,0.35)] hover:text-primary text-xs transition-colors"
                >
                  ¿Olvidó su clave de acceso?
                </Link>
              </div>
            </div>

            {/* Legal Protocol Note */}
            <div className="mt-4 text-center login-fade-6">
              <p className="text-[rgba(248,246,246,0.25)] text-[11px] leading-relaxed">
                Al ingresar confirma su adhesión a las políticas de seguridad y protección de datos comerciales de Saboré.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          LIVING 3D PRODUCT SHOWCASE SECTION
         ══════════════════════════════════════════════════════ */}
      <div id="showcase-section">
        <LivingProductShowcase />
      </div>
    </main>
  );
}
