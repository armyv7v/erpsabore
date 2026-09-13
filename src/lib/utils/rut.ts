/**
 * Autoformato de RUT chileno (audit 2026-09-13, P1/P2/P3 — ley de Postel):
 * acepta lo que sea y lo deja con puntos y guion. Idempotente.
 * Ej: "12345678k" -> "12.345.678-K", "12.345.678-K" -> "12.345.678-K".
 */
export function formatRut(raw: string): string {
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return clean;

  const dv = clean.slice(-1);
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${dv}`;
}
