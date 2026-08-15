"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface SpecimenPhysics {
  id: string;
  src: string;
  alt: string;
  anchorX: number;
  anchorY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseOpacity: number;
  currentOpacity: number;
  mass: number;
  phase: number;
  phaseSpeed: number;
  orbitRadiusX: number;
  orbitRadiusY: number;
  rotation: number;
  rotationSpeed: number;
}

// 4 iconic specimens (reduced by ~40% for balanced composition)
const SPECIMENS_DATA = [
  {
    id: "cucharas",
    src: "/brand/cucharas.jpg",
    alt: "Cucharas Biodegradables",
    anchorX: 45,
    anchorY: 22,
    size: 135,
    baseOpacity: 0.24,
    orbitRadiusX: 130,
    orbitRadiusY: 90,
    phaseSpeed: 0.00035, // Smooth, serene speed
    rotationSpeed: 0.04,
    mass: 1.6,
  },
  {
    id: "rollo",
    src: "/catalogo_webp/rollo_kraf.webp",
    alt: "Rollo Kraft Industrial",
    anchorX: 68,
    anchorY: 65,
    size: 155,
    baseOpacity: 0.22,
    orbitRadiusX: 160,
    orbitRadiusY: 110,
    phaseSpeed: 0.00028,
    rotationSpeed: -0.03,
    mass: 2.2,
  },
  {
    id: "bolsas",
    src: "/catalogo_webp/page-03-img-03-0020.webp",
    alt: "Bolsas Kraft Delivery",
    anchorX: 38,
    anchorY: 78,
    size: 140,
    baseOpacity: 0.24,
    orbitRadiusX: 140,
    orbitRadiusY: 95,
    phaseSpeed: 0.0004,
    rotationSpeed: 0.045,
    mass: 1.8,
  },
  {
    id: "papel-antigrasa",
    src: "/catalogo_webp/papel_antigrasa.webp",
    alt: "Papel Antigrasa Satinado",
    anchorX: 80,
    anchorY: 20,
    size: 145,
    baseOpacity: 0.2,
    orbitRadiusX: 150,
    orbitRadiusY: 100,
    phaseSpeed: 0.0003,
    rotationSpeed: 0.03,
    mass: 1.9,
  },
];

export default function LivingFloatingBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const elementsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let animationId: number;
    let time = 0;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const specimens: SpecimenPhysics[] = SPECIMENS_DATA.map((item, i) => {
      const initialX = (item.anchorX / 100) * width;
      const initialY = (item.anchorY / 100) * height;
      return {
        ...item,
        x: initialX,
        y: initialY,
        vx: 0,
        vy: 0,
        currentOpacity: item.baseOpacity,
        phase: (i * Math.PI * 2) / SPECIMENS_DATA.length,
        rotation: 0,
      };
    });

    const mouse = {
      x: -1000,
      y: -1000,
      active: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);

    const loop = () => {
      time += 1;

      specimens.forEach((sp, idx) => {
        const el = elementsRef.current[idx];
        if (!el) return;

        // 1. Serene organic floating drift
        sp.phase += sp.phaseSpeed;
        const targetAnchorX = (sp.anchorX / 100) * width;
        const targetAnchorY = (sp.anchorY / 100) * height;

        const harmonicOffsetX =
          Math.sin(sp.phase + time * 0.0015) * sp.orbitRadiusX +
          Math.sin(sp.phase * 0.6) * (sp.orbitRadiusX * 0.25);

        const harmonicOffsetY =
          Math.cos(sp.phase * 0.9 + time * 0.0012) * sp.orbitRadiusY +
          Math.sin(sp.phase * 1.4) * (sp.orbitRadiusY * 0.2);

        const desiredX = targetAnchorX + harmonicOffsetX;
        const desiredY = targetAnchorY + harmonicOffsetY;

        // Gentle spring
        const springK = 0.008 / sp.mass;
        const springForceX = (desiredX - sp.x) * springK;
        const springForceY = (desiredY - sp.y) * springK;

        sp.vx += springForceX;
        sp.vy += springForceY;

        // 2. Smooth gentle cursor repulsion
        if (mouse.active) {
          const dx = sp.x - mouse.x;
          const dy = sp.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          const repulsionRadius = 260;

          if (dist < repulsionRadius && dist > 0) {
            const force = Math.pow(1 - dist / repulsionRadius, 1.8) * (8 / sp.mass);
            const angle = Math.atan2(dy, dx);

            sp.vx += Math.cos(angle) * force;
            sp.vy += Math.sin(angle) * force;
            sp.rotation += (Math.sin(angle) * force * 0.4) / sp.mass;
            sp.currentOpacity = Math.min(0.48, sp.baseOpacity + force * 0.03);
          } else {
            sp.currentOpacity += (sp.baseOpacity - sp.currentOpacity) * 0.03;
          }
        }

        // 3. Fluid drag
        sp.vx *= 0.96;
        sp.vy *= 0.96;

        sp.x += sp.vx;
        sp.y += sp.vy;

        sp.rotation += sp.rotationSpeed + sp.vx * 0.04;

        // Subtle 3D tilt
        const tiltX = Math.max(-14, Math.min(14, -sp.vy * 0.8));
        const tiltY = Math.max(-14, Math.min(14, sp.vx * 0.8));
        const breathingScale = 1 + Math.sin(sp.phase * 1.5) * 0.04;

        el.style.transform = `translate3d(${sp.x - targetAnchorX}px, ${sp.y - targetAnchorY}px, 0) perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(${sp.rotation}deg) scale(${breathingScale})`;
        el.style.opacity = `${sp.currentOpacity}`;
      });

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {SPECIMENS_DATA.map((item, idx) => (
        <div
          key={item.id}
          ref={(el) => {
            elementsRef.current[idx] = el;
          }}
          className="absolute will-change-transform rounded-3xl"
          style={{
            top: `${item.anchorY}%`,
            left: `${item.anchorX}%`,
            width: item.size,
            height: item.size,
            marginLeft: -item.size / 2,
            marginTop: -item.size / 2,
            opacity: item.baseOpacity,
          }}
        >
          {/* Gentle ambient glow */}
          <div className="absolute inset-0 bg-primary/15 rounded-full blur-2xl -z-10" />

          {/* Translucent glass bio-capsule */}
          <div className="relative w-full h-full p-2.5 rounded-3xl bg-[#221610]/35 border border-primary/20 backdrop-blur-[2px] shadow-[0_15px_30px_rgba(0,0,0,0.6)] flex items-center justify-center">
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-contain p-2 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] filter brightness-95 contrast-105"
              sizes="160px"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
