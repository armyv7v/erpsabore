"use client";

import { useEffect, useRef } from "react";
import styles from "./ExperienceLanding.module.css";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./experience-shaders";

type ExperienceStageProps = {
  paused: boolean;
  quiet: boolean;
  onError: (message: string) => void;
};

const FREEZE = 7.5;

export default function ExperienceStage({ paused, quiet, onError }: ExperienceStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controlRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const pausedRef = useRef(paused);
  const quietRef = useRef(quiet);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const el: HTMLCanvasElement = canvasEl;

    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = el.getContext("webgl2", {
        antialias: true,
        alpha: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
      });
    } catch {
      gl = null;
    }

    if (!gl) {
      onError(
        "Esta escena necesita WebGL2 y su navegador no lo tiene disponible. El contenido de la página sigue disponible."
      );
      return;
    }

    const ctx = gl;
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    let program: WebGLProgram;
    const u = {
      res: null as WebGLUniformLocation | null,
      time: null as WebGLUniformLocation | null,
      pointer: null as WebGLUniformLocation | null,
      scroll: null as WebGLUniformLocation | null,
      orbit: null as WebGLUniformLocation | null,
      fit: null as WebGLUniformLocation | null,
      camX: null as WebGLUniformLocation | null,
    };

    let raf = 0;
    let running = false;
    let last = 0;
    let time = FREEZE;
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;
    let orbit = 0;
    let orbitVel = 0;
    let scroll = 0;
    let sTarget = 0;
    let fit = 1;
    let camX = 0;
    let heroVisible = true;
    let dragging = false;
    let lastX = 0;

    function compileShader(type: number, source: string) {
      const shader = ctx.createShader(type);
      if (!shader) throw new Error("No se pudo crear el shader");
      ctx.shaderSource(shader, source);
      ctx.compileShader(shader);
      if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
        const info = ctx.getShaderInfoLog(shader) || "Error de compilación";
        ctx.deleteShader(shader);
        throw new Error(info);
      }
      return shader;
    }

    function updateLayout() {
      const aspect = (el.clientWidth || 1) / (el.clientHeight || 1);
      if (aspect >= 1.5) fit = 1;
      else if (aspect >= 1) fit = Math.max(0.7, aspect / 1.5);
      else fit = Math.max(0.40, aspect * 0.62);
      camX = Math.min(0.18, Math.max(0, (aspect - 1) * 0.18));
    }

    function syncCanvas() {
      const cssW = Math.max(1, el.clientWidth || window.innerWidth);
      const cssH = Math.max(1, el.clientHeight || window.innerHeight);
      let dpr = Math.min(window.devicePixelRatio || 1, 2);
      const budget = 4200000;
      if (cssW * cssH * dpr * dpr > budget) {
        dpr = Math.sqrt(budget / (cssW * cssH));
      }
      const width = Math.max(1, Math.floor(cssW * dpr));
      const height = Math.max(1, Math.floor(cssH * dpr));
      if (width !== el.width || height !== el.height) {
        el.width = width;
        el.height = height;
        ctx.viewport(0, 0, width, height);
        updateLayout();
        return true;
      }
      return false;
    }

    function draw(now: number) {
      syncCanvas();
      ctx.useProgram(program);
      ctx.uniform2f(u.res, el.width, el.height);
      ctx.uniform1f(u.time, now);
      ctx.uniform2f(u.pointer, px, py);
      ctx.uniform1f(u.scroll, scroll);
      ctx.uniform1f(u.orbit, orbit);
      ctx.uniform1f(u.fit, fit);
      ctx.uniform1f(u.camX, camX);
      ctx.clearColor(0.953, 0.949, 0.941, 1);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.drawArrays(ctx.TRIANGLES, 0, 3);
    }

    function stop() {
      running = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function fail(message: string) {
      stop();
      onError(message);
    }

    function loop(now: number) {
      if (!running) return;
      if (!last) last = now;
      let dt = Math.min((now - last) / 1000, 0.05);
      if (!isFinite(dt) || dt < 0) dt = 0;
      last = now;
      time += dt * 0.9;

      const easePointer = 1 - Math.exp(-dt * 7);
      px += (tx - px) * easePointer;
      py += (ty - py) * easePointer;

      orbit += orbitVel;
      orbitVel *= Math.exp(-dt * 3.4);
      if (Math.abs(orbitVel) < 0.0004) orbitVel = 0;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      sTarget = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      const easeScroll = 1 - Math.exp(-dt * 5);
      scroll += (sTarget - scroll) * easeScroll;

      draw(time);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (!program || reduceMq.matches || pausedRef.current || quietRef.current || !heroVisible || document.hidden) return;
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    }

    function onPointerMove(event: PointerEvent) {
      tx = (event.clientX / window.innerWidth) * 2 - 1;
      ty = -((event.clientY / window.innerHeight) * 2 - 1);
      if (!dragging) return;
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      orbitVel += dx * 0.0026;
      orbitVel = Math.max(-0.09, Math.min(0.09, orbitVel));
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      const interactive = target instanceof Element && target.closest("a, button, input, textarea, select");
      if (interactive || event.button !== 0 || event.pointerType === "touch") return;
      dragging = true;
      lastX = event.clientX;
      document.body.style.userSelect = "none";
    }

    function onPointerUp() {
      dragging = false;
      document.body.style.userSelect = "";
    }

    function onVisibilityChange() {
      if (document.hidden) stop();
      else start();
    }

    function onMotionChange() {
      if (reduceMq.matches) {
        stop();
        time = FREEZE;
        px = 0;
        py = 0;
        draw(time);
      } else if (heroVisible) {
        start();
      }
    }

    function onLost(event: Event) {
      event.preventDefault();
      fail("Se perdió el contexto gráfico. Recargue la página para volver a ver la escena.");
    }

    function resize() {
      const changed = syncCanvas();
      if (changed && !running && !pausedRef.current) draw(time);
    }

    try {
      const vs = compileShader(ctx.VERTEX_SHADER, VERTEX_SHADER);
      const fs = compileShader(ctx.FRAGMENT_SHADER, FRAGMENT_SHADER);
      program = ctx.createProgram();
      ctx.attachShader(program, vs);
      ctx.attachShader(program, fs);
      ctx.linkProgram(program);
      if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
        throw new Error(ctx.getProgramInfoLog(program) || "Error de enlace");
      }
      ctx.deleteShader(vs);
      ctx.deleteShader(fs);
    } catch (error) {
      console.error("WebGL:", error);
      fail("No se pudo iniciar la escena en este equipo. El contenido de la página sigue disponible.");
      return;
    }

    u.res = ctx.getUniformLocation(program, "uRes");
    u.time = ctx.getUniformLocation(program, "uTime");
    u.pointer = ctx.getUniformLocation(program, "uPointer");
    u.scroll = ctx.getUniformLocation(program, "uScroll");
    u.orbit = ctx.getUniformLocation(program, "uOrbit");
    u.fit = ctx.getUniformLocation(program, "uFit");
    u.camX = ctx.getUniformLocation(program, "uCamX");

    const buffer = ctx.createBuffer() as WebGLBuffer;
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW);
    const position = ctx.getAttribLocation(program, "aPos");
    ctx.enableVertexAttribArray(position);
    ctx.vertexAttribPointer(position, 2, ctx.FLOAT, false, 0, 0);
    ctx.useProgram(program);
    ctx.disable(ctx.DEPTH_TEST);

    updateLayout();
    syncCanvas();
    sTarget = 0;
    draw(time);

    el.addEventListener("webglcontextlost", onLost, false);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    document.addEventListener("visibilitychange", onVisibilityChange);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(el);
    } else {
      window.addEventListener("resize", resize, { passive: true });
    }

    let heroObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      heroObserver = new IntersectionObserver(
        (entries) => {
          heroVisible = entries[0]?.isIntersecting ?? true;
          if (heroVisible) start();
          else stop();
        },
        { threshold: 0.04 }
      );
      heroObserver.observe(el);
    }

    if (typeof reduceMq.addEventListener === "function") {
      reduceMq.addEventListener("change", onMotionChange);
    } else {
      reduceMq.addListener(onMotionChange);
    }

    controlRef.current = { start, stop };
    if (!reduceMq.matches) start();

    return () => {
      stop();
      controlRef.current = null;
      el.removeEventListener("webglcontextlost", onLost);

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", resize);
      }

      if (heroObserver) heroObserver.disconnect();

      if (typeof reduceMq.removeEventListener === "function") {
        reduceMq.removeEventListener("change", onMotionChange);
      } else {
        reduceMq.removeListener(onMotionChange);
      }

      document.body.style.userSelect = "";
      dragging = false;

      ctx.deleteBuffer(buffer);
      ctx.deleteProgram(program);
    };
  }, [onError]);

  useEffect(() => {
    pausedRef.current = paused;
    quietRef.current = quiet;
    if (!controlRef.current) return;
    if (paused || quiet) controlRef.current.stop();
    else controlRef.current.start();
  }, [paused, quiet]);

  return (
    <div className={styles.stage}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}
