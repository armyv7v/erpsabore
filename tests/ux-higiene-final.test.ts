import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { formatRut } from "../src/lib/utils/rut";

// Regresión estática PR-F (audit 2026-09-13, S5, P1-P3, Gr1, A1 y deuda):
// headers de seguridad, máscara de RUT, labels en CRM, focus-visible y
// código muerto eliminado.
function readRepo(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), "utf8");
}

describe("Fase PR-F — higiene final (regresión estática)", () => {
  it("P1-P3 — formatRut formatea e es idempotente", () => {
    expect(formatRut("12345678k")).toBe("12.345.678-K");
    expect(formatRut("12.345.678-k")).toBe("12.345.678-K");
    expect(formatRut("12.345.678-K")).toBe("12.345.678-K"); // idempotente
    expect(formatRut("761234567")).toBe("76.123.456-7");
    expect(formatRut("")).toBe("");
    expect(formatRut("1")).toBe("1"); // muy corto: pasa tal cual
  });

  it("los 3 inputs de RUT formatean en blur", () => {
    expect(readRepo("src/components/erp/PosWorkspace.tsx")).toContain("setCustomerRut(formatRut(e.target.value))");
    expect(readRepo("src/components/auth/RegisterForm.tsx")).toContain("formatRut(e.currentTarget.value)");
    expect(readRepo("src/app/catalogo/catalog-client.tsx")).toContain("formatRut");
  });

  it("S5 — next.config define headers de seguridad", () => {
    const cfg = readRepo("next.config.ts");
    expect(cfg).toContain("Content-Security-Policy-Report-Only");
    expect(cfg).toContain("X-Frame-Options");
    expect(cfg).toContain("X-Content-Type-Options");
    expect(cfg).toContain("Strict-Transport-Security");
    expect(cfg).toContain("async headers()");
  });

  it("A1 — regla global de :focus-visible en globals.css", () => {
    const css = readRepo("src/app/globals.css");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline: 2px solid var(--color-primary");
  });

  it("Gr1 — los formularios de CRM usan CrmField con label asociado", () => {
    const crm = readRepo("src/components/erp/CRMWorkspace.tsx");
    const fields = (crm.match(/<CrmField label="/g) ?? []).length;
    expect(fields).toBe(16); // 4 nuevo cliente + 4 nueva oportunidad + 4 editar + 4 convertir
    expect(crm).toContain('htmlFor={id}');
  });

  it("deuda — token-client eliminado y sin logs con PII", () => {
    expect(existsSync(resolve(process.cwd(), "src/lib/supabase/token-client.ts"))).toBe(false);
    const adapter = readRepo("src/lib/dte/local-dte-adapter.ts");
    expect(adapter).not.toContain("rut_firmante: ${cert.rutFirmante}");
  });
});
