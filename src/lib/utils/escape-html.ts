/**
 * Escapa texto interpolado en ventanas de impresión generadas con
 * document.write (audit 2026-09-13, S6): los datos vienen de la BD y
 * pueden contener HTML de usuarios (customerName, reference, etc.).
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
