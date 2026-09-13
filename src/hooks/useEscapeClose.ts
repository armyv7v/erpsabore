"use client";

/**
 * Cierra un modal con Escape (audit 2026-09-13, J1), replicando el patrón
 * de ImageZoomLightbox. Llamar una vez por modal con su boolean de apertura;
 * los efectos de modales cerrados no suscriben nada.
 */
import { useEffect } from "react";

export function useEscapeClose(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);
}
