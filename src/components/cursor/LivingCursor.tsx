"use client";

import React, { useEffect, useState, useRef } from "react";

export default function LivingCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState<string | null>(null);
  const [clicking, setClicking] = useState(false);

  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  const pos = useRef({
    x: -100,
    y: -100,
    targetX: -100,
    targetY: -100,
    ringX: -100,
    ringY: -100,
    vx: 0,
    vy: 0,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
  });

  useEffect(() => {
    // Only enable for pointer devices (non-touch)
    if (window.matchMedia("(pointer: fine)").matches) {
      setEnabled(true);
    } else {
      return;
    }

    let animationId: number;

    const onMouseMove = (e: MouseEvent) => {
      pos.current.targetX = e.clientX;
      pos.current.targetY = e.clientY;
    };

    const onMouseDown = () => setClicking(true);
    const onMouseUp = () => setClicking(false);

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest("button, a, input, [data-magnetic], .interactive-hover");
      if (interactive) {
        setHovering(interactive.tagName.toLowerCase());
      } else {
        setHovering(null);
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mouseover", onMouseOver, { passive: true });

    // Loop
    const loop = () => {
      const p = pos.current;

      // Elastic follow
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      p.x += dx * 0.45;
      p.y += dy * 0.45;

      const rdx = p.x - p.ringX;
      const rdy = p.y - p.ringY;
      p.ringX += rdx * 0.18;
      p.ringY += rdy * 0.18;

      // Velocity & deformation
      const speed = Math.hypot(rdx, rdy);
      const angle = Math.atan2(rdy, rdx);
      const stretch = Math.min(speed * 0.04, 0.45);

      if (dotRef.current && ringRef.current) {
        dotRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
        ringRef.current.style.transform = `translate3d(${p.ringX}px, ${p.ringY}px, 0) translate(-50%, -50%) rotate(${angle}rad) scale(${1 + stretch}, ${1 - stretch * 0.5})`;
      }

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mouseover", onMouseOver);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {/* Living Outer Ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full border transition-colors duration-200 ${
          hovering
            ? "w-14 h-14 border-primary/80 bg-primary/10 backdrop-blur-[1px] shadow-[0_0_25px_rgba(188,122,58,0.4)]"
            : clicking
            ? "w-8 h-8 border-primary bg-primary/20"
            : "w-10 h-10 border-primary/40 bg-transparent"
        }`}
        style={{ willChange: "transform" }}
      />

      {/* Living Core Particle */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full transition-all duration-150 ${
          hovering
            ? "w-3 h-3 bg-white shadow-[0_0_12px_#ffffff]"
            : clicking
            ? "w-4 h-4 bg-primary scale-125 shadow-[0_0_16px_rgba(188,122,58,0.9)]"
            : "w-2 h-2 bg-primary shadow-[0_0_8px_rgba(188,122,58,0.8)]"
        }`}
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
