"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  connectionRadius: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export default function BioOrganismCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // High DPI Canvas setup
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const updateSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    updateSize();

    // Mouse state with inertia
    const mouse = {
      x: width * 0.5,
      y: height * 0.5,
      targetX: width * 0.5,
      targetY: height * 0.5,
      radius: 220,
      active: false,
      speed: 0,
      prevX: width * 0.5,
      prevY: height * 0.5,
    };

    // Rich bio-luminescent color palette
    const colors = [
      "rgba(188, 122, 58, ",  // Warm Camel Amber #BC7A3A
      "rgba(245, 158, 11, ",  // Vibrant Glowing Gold #F59E0B
      "rgba(253, 230, 138, ", // Luminescent Star #FDE68A
      "rgba(230, 168, 104, ", // Soft Glow #E6A868
    ];

    // High density particle count for rich living ecosystem
    const particleCount = Math.min(Math.floor((width * height) / 9000), 110);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const colorPrefix = colors[Math.floor(Math.random() * colors.length)];
      const baseAlpha = 0.35 + Math.random() * 0.55;
      const baseSize = 1.8 + Math.random() * 3.2;

      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9,
        size: baseSize,
        baseSize,
        color: colorPrefix,
        alpha: baseAlpha,
        baseAlpha,
        phase: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.025,
        connectionRadius: 110 + Math.random() * 50,
      });
    }

    const shockwaves: Shockwave[] = [];

    // Mouse & Touch events
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 6,
        maxRadius: 320,
        alpha: 0.9,
        color: "rgba(245, 158, 11,",
      });

      // Detonate outward particle impulse
      for (const p of particles) {
        const dx = p.x - e.clientX;
        const dy = p.y - e.clientY;
        const dist = Math.hypot(dx, dy);
        if (dist < 320 && dist > 0) {
          const force = (1 - dist / 320) * 20;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.active = true;
      }
    };

    window.addEventListener("resize", updateSize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleClick);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    let time = 0;

    // Animation Loop
    const render = () => {
      time += 0.018;

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      ctx.clearRect(0, 0, width, height);

      // Living organic background radial light
      const grad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        15,
        mouse.x,
        mouse.y,
        Math.max(width * 0.55, 450)
      );
      grad.addColorStop(0, "rgba(188, 122, 58, 0.12)");
      grad.addColorStop(0.45, "rgba(66, 67, 28, 0.05)");
      grad.addColorStop(1, "rgba(28, 17, 11, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Update & Draw Shockwaves
      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const sw = shockwaves[s];
        sw.radius += 7;
        sw.alpha *= 0.94;

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${sw.color} ${sw.alpha})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        if (sw.alpha < 0.01 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(s, 1);
        }
      }

      // Update and Draw Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Organic oscillation
        p.phase += p.speed;
        const oscillationX = Math.sin(p.phase + time) * 0.75;
        const oscillationY = Math.cos(p.phase * 1.3 + time) * 0.75;

        p.x += p.vx + oscillationX;
        p.y += p.vy + oscillationY;

        // Damping
        p.vx *= 0.93;
        p.vy *= 0.93;

        // Boundary wrapping
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Mouse proximity reaction (Vortex + Repulsion)
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouse.radius && dist > 0) {
            const force = (1 - dist / mouse.radius);
            const angle = Math.atan2(dy, dx);

            p.vx -= Math.cos(angle) * force * 2.2;
            p.vy -= Math.sin(angle) * force * 2.2;

            p.vx += -Math.sin(angle) * force * 1.2;
            p.vy += Math.cos(angle) * force * 1.2;

            p.size = p.baseSize * (1 + force * 1.4);
            p.alpha = Math.min(1, p.baseAlpha + force * 0.45);
          } else {
            p.size += (p.baseSize - p.size) * 0.06;
            p.alpha += (p.baseAlpha - p.alpha) * 0.06;
          }
        }

        // Draw particle nucleus with luminescence
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.shadowColor = "rgba(245, 158, 11, 0.8)";
        ctx.shadowBlur = p.size * 5;
        ctx.fill();
        ctx.shadowBlur = 0; // reset for lines

        // Draw neural connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.hypot(cdx, cdy);

          if (cdist < p.connectionRadius) {
            const lineAlpha = (1 - cdist / p.connectionRadius) * 0.35 * Math.min(p.alpha, p2.alpha);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(188, 122, 58, ${lineAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
