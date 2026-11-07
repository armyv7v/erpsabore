"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Building2, ShoppingBag } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import ExperienceStage from "@/components/landing/ExperienceStage";
import styles from "./ExperienceLanding.module.css";

export default function ExperienceLandingClient() {
  const [loginMode, setLoginMode] = useState<"client" | "erp">("client");
  const [paused, setPaused] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${value})`;
      }
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduceMq.matches || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.setAttribute("data-visible", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          const siblings = target.parentElement
            ? Array.from(target.parentElement.querySelectorAll<HTMLElement>("[data-reveal]"))
            : [];
          const index = Math.max(0, siblings.indexOf(target));
          target.style.transitionDelay = `${Math.min(index, 5) * 50}ms`;
          target.setAttribute("data-visible", "true");
          observer.unobserve(target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main className={styles.page}>
      <a className={styles.skip} href="#contenido">
        Saltar al contenido
      </a>

      <div className={styles.progress} aria-hidden="true">
        <span ref={progressRef} />
      </div>

      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href="/login" className={styles.brandLink} aria-label="Saboré, ir al inicio">
            <Image
              src="/brand/logo_negro_sin_fondo.png"
              alt="Saboré Insumos y Suministros"
              width={186}
              height={44}
              className={styles.logo}
              priority
            />
          </Link>

          <nav className={styles.topnav} aria-label="Secciones del sitio">
            <a href="#proposito">Propósito</a>
            <a href="#resolvemos">Qué resolvemos</a>
            <a href="#como">Cómo funciona</a>
            <a href="#contacto">Contacto</a>
          </nav>

          <div className={styles.topActions}>
            <a className={styles.accessLink} href="#acceso">
              Acceso
            </a>
            <Link className={styles.catalogLink} href="/catalogo">
              Ver catálogo
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.hero} id="contenido" aria-labelledby="hero-title">
        <ExperienceStage paused={paused} onError={setStageError} />
        <div className={styles.heroOverlay} aria-hidden="true" />

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Saboré — Insumos y suministros gastronómicos</p>
            <h1 className={styles.heroTitle} id="hero-title">
              Todo lo que su negocio necesita, en movimiento.
            </h1>
            <p className={styles.lede}>
              Catálogo con precios por mayor y detalle, listas guardadas y despacho coordinado
              a su local. Una cadena de suministro que responde al ritmo de su cocina.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.cta} href="/catalogo">
                Ver catálogo
                <ArrowRight aria-hidden="true" />
              </Link>
              <a className={styles.ctaGhost} href="#acceso">
                Ya soy cliente
                <ArrowDown aria-hidden="true" />
              </a>
            </div>
            <p className={styles.hint}>Arrastre para girar · Mueva para inclinar la luz</p>
          </div>

          <aside className={styles.accessCard} id="acceso" aria-labelledby="login-title">
            <div className={styles.loginTabs} role="tablist" aria-label="Tipo de acceso">
              <button
                type="button"
                role="tab"
                aria-selected={loginMode === "client"}
                onClick={() => setLoginMode("client")}
                className={`${styles.loginTab} ${loginMode === "client" ? styles.loginTabActive : ""}`}
              >
                <ShoppingBag aria-hidden="true" />
                Portal clientes
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={loginMode === "erp"}
                onClick={() => setLoginMode("erp")}
                className={`${styles.loginTab} ${loginMode === "erp" ? styles.loginTabActive : ""}`}
              >
                <Building2 aria-hidden="true" />
                Acceso ERP
              </button>
            </div>

            <div className={styles.loginHead}>
              <h2 id="login-title">
                {loginMode === "client" ? "Acceso a clientes" : "Acceso administrativo"}
              </h2>
              <p>
                {loginMode === "client"
                  ? "Ingrese con su correo corporativo para ver tarifas preferenciales y coordinar despachos."
                  : "Módulo de administración: facturación, inventario y reportería interna."}
              </p>
            </div>

            {!isSupabaseConfigured() ? (
              <div className={styles.loginWarning}>
                Falta configurar <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
              </div>
            ) : null}

            <div className={styles.loginForm}>
              <LoginForm />
            </div>

            {loginMode === "client" ? (
              <div className={styles.loginLinks}>
                <p className={styles.loginHint}>¿Primera vez comprando con nosotros?</p>
                <Link className={styles.loginLink} href="/registro">
                  Crear cuenta de cliente
                </Link>
                <Link className={styles.loginGuest} href="/catalogo">
                  Entrar como invitado al catálogo
                </Link>
              </div>
            ) : (
              <p className={styles.loginNote}>
                El acceso administrativo requiere credenciales autorizadas con doble factor.
              </p>
            )}
          </aside>
        </div>

        {stageError ? (
          <p className={styles.glFallback} role="status">
            {stageError}
          </p>
        ) : null}

        <div className={styles.heroScroll} aria-hidden="true">
          <span className={styles.scrollLine} />
          <span>Desliza</span>
        </div>
      </section>

      <section className={styles.panel} id="proposito" aria-labelledby="proposito-title">
        <div className={styles.wrap}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal="true">
            <p className={styles.eyebrow}>01 — Propósito</p>
            <h2 className={styles.panelTitle} id="proposito-title">
              Abastecer no es solo entregar. Es sostener el ritmo de su negocio.
            </h2>
          </div>

          <div className={styles.statementGrid}>
            <p className={`${styles.statement} ${styles.reveal}`} data-reveal="true">
              Trabajamos para que su operación no tenga que pensar en el suministro. Catálogo,
              precios y despacho en un mismo lugar: la cocina sigue su curso, incluso cuando el
              ritmo sube.
            </p>
            <div className={`${styles.sideNote} ${styles.reveal}`} data-reveal="true">
              <p className={styles.noteLabel}>Nota de operación 001</p>
              <p>
                Un pedido no se mide solo por lo que llega, sino por lo que no interrumpe. Por eso
                cada decisión de abastecimiento empieza por una pregunta simple: ¿qué necesita su
                negocio para seguir funcionando?
              </p>
              <p className={styles.noteMark}>— Saboré</p>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`${styles.panel} ${styles.panelAlt}`}
        id="resolvemos"
        aria-labelledby="resolvemos-title"
      >
        <div className={styles.wrap}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal="true">
            <p className={styles.eyebrow}>02 — Qué resolvemos</p>
            <h2 className={styles.panelTitle} id="resolvemos-title">
              Tres piezas para que la operación no se detenga.
            </h2>
          </div>

          <div className={styles.caps}>
            <article className={`${styles.cap} ${styles.reveal}`} data-reveal="true">
              <p className={styles.capNum}>01</p>
              <h3>Catálogo con precios claros</h3>
              <p>
                Precios por mayor y detalle, listas guardadas y disponibilidad a la vista para
                comprar sin fricción.
              </p>
              <p className={styles.tags}>Catálogo · Precios · Listas</p>
            </article>

            <article className={`${styles.cap} ${styles.reveal}`} data-reveal="true">
              <p className={styles.capNum}>02</p>
              <h3>Despacho coordinado</h3>
              <p>
                Coordinamos la entrega con su local, con ventanas de despacho y seguimiento del
                pedido.
              </p>
              <p className={styles.tags}>Logística · Despacho · Seguimiento</p>
            </article>

            <article className={`${styles.cap} ${styles.reveal}`} data-reveal="true">
              <p className={styles.capNum}>03</p>
              <h3>Calidad alimentaria</h3>
              <p>
                Insumos y suministros con trazabilidad y respaldo para la operación diaria de su
                negocio.
              </p>
              <p className={styles.tags}>Calidad · Trazabilidad · Respaldo</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.panel} id="como" aria-labelledby="como-title">
        <div className={styles.wrap}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal="true">
            <p className={styles.eyebrow}>03 — Cómo funciona</p>
            <h2 className={styles.panelTitle} id="como-title">
              Del catálogo a su cocina, sin pasos de más.
            </h2>
          </div>

          <div className={styles.steps}>
            <div className={`${styles.step} ${styles.reveal}`} data-reveal="true">
              <p className={styles.stepNum}>01</p>
              <h3>Elija</h3>
              <p>Recorra el catálogo con precios por mayor y detalle y arme su lista.</p>
            </div>
            <div className={`${styles.step} ${styles.reveal}`} data-reveal="true">
              <p className={styles.stepNum}>02</p>
              <h3>Confirme</h3>
              <p>
                Ingrese con su cuenta para confirmar tarifas, disponibilidad y condiciones del
                pedido.
              </p>
            </div>
            <div className={`${styles.step} ${styles.reveal}`} data-reveal="true">
              <p className={styles.stepNum}>03</p>
              <h3>Reciba</h3>
              <p>Coordine el despacho a su local y siga el estado del pedido.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.contact} id="contacto" aria-labelledby="contacto-title">
        <div className={styles.wrap}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal="true">
            <p className={styles.eyebrow}>04 — Contacto</p>
            <h2 className={styles.panelTitle} id="contacto-title">
              Hablemos de lo que su negocio necesita.
            </h2>
          </div>

          <div className={styles.contactGrid}>
            <p className={`${styles.statement} ${styles.reveal}`} data-reveal="true">
              Cuéntenos qué insumos o suministros necesita. Respondemos con una lectura concreta
              de su operación, no con una plantilla.
            </p>

            <div className={styles.reveal} data-reveal="true">
              <a className={styles.mail} href="mailto:contacto@sabore.cl">
                contacto@sabore.cl
              </a>
              <ul className={styles.contactMeta}>
                <li>Saboré Insumos y Suministros</li>
                <li>Providencia · Santiago</li>
                <li>
                  <a href="tel:+56223456789">+56 2 2345 6789</a>
                </li>
              </ul>
              <div className={styles.contactActions}>
                <Link className={styles.contactCta} href="/catalogo">
                  Ver catálogo completo
                  <ArrowRight aria-hidden="true" />
                </Link>
                <a className={styles.contactGhost} href="#acceso">
                  Ya soy cliente
                  <ArrowDown aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>© {new Date().getFullYear()} Saboré Insumos y Suministros</p>
          <p>
            Al ingresar confirma su adhesión a las políticas de seguridad y protección de datos
            comerciales.
          </p>
        </div>
      </footer>

      {!stageError ? (
        <div className={styles.controls}>
          <button
            className={styles.motionToggle}
            type="button"
            aria-pressed={paused}
            aria-label={paused ? "Reanudar animación" : "Pausar animación"}
            onClick={() => setPaused((value) => !value)}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span>{paused ? "Reanudar" : "Pausar"}</span>
          </button>
        </div>
      ) : null}
    </main>
  );
}
