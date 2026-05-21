"use client";

import React, { useEffect, useRef, useState } from "react";
// @ts-ignore
import { PDF417 } from "pdf417-generator";

interface BarcodePdf417Props {
  code: string;
  width?: number;
  height?: number;
}

export default function BarcodePdf417({ code, width = 450, height = 150 }: BarcodePdf417Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      setError(null);
      // Limpiamos el canvas antes de dibujar
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      // Dibujamos el código PDF417 nativamente en el canvas
      // pdf417-generator toma los datos y dibuja directamente en el canvas provisto.
      // Usamos el string del timbre electrónico TED.
      PDF417.draw(code.trim(), canvasRef.current);
    } catch (err: any) {
      console.error("[BarcodePdf417 Error] Falló el renderizado:", err);
      setError(err.message || "Error al codificar el timbre en formato PDF417.");
    }
  }, [code]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-center text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20">
        <p className="text-xs font-semibold">⚠️ Timbre PDF417 no disponible</p>
        <p className="mt-1 text-[10px] opacity-80">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          maxHeight: `${height}px`,
          maxWidth: `${width}px`,
          imageRendering: "pixelated", // Máxima nitidez para escaneo óptico e impresión
        }}
        className="block mx-auto"
      />
    </div>
  );
}
