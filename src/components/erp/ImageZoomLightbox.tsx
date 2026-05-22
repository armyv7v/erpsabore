"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  imageUrl: string;
  onClose: () => void;
}

export default function ImageZoomLightbox({ imageUrl, onClose }: Props) {
  // Manejador de teclado para cerrar con Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    // Bloquear scroll de fondo
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 size-12 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full flex items-center justify-center transition-all cursor-pointer z-10"
        title="Cerrar (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full h-full max-w-[95vw] max-h-[85vh] md:max-w-[90vw] flex items-center justify-center select-none pointer-events-none animate-in zoom-in-95 duration-200">
        <img
          src={imageUrl}
          alt="Foto ampliada del producto"
          className="w-full h-full object-contain rounded-2xl shadow-2xl scale-100"
        />
      </div>

      <div className="absolute bottom-6 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full text-[10px] text-slate-400 uppercase tracking-widest pointer-events-none">
        Haz clic en cualquier lugar para cerrar
      </div>
    </div>
  );
}
