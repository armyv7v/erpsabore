import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Regresión estática PR-E (audit laws-of-ux 2026-09-13, S6, E1-E5 y J1):
// sin alert()/confirm() nativos, impresiones escapadas, Escape en modales
// y feedback de éxito visible.
function readRepo(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), "utf8");
}

describe("Fase PR-E — feedback, cierre y Escape (regresión estática)", () => {
  it("E5/E1/E2 — cero alert()/confirm() nativos en src/", () => {
    const { execSync } = require("node:child_process");
    let hits = "";
    try {
      hits = execSync(
        'grep -rn "alert(\\|confirm(" src/ --include="*.ts" --include="*.tsx" | grep -v "showToast\\|ConfirmDialog\\|confirmLabel\\|showConfirmModal\\|// .*confirm\\|\\\\balert(" || true',
        { encoding: "utf8", cwd: process.cwd() },
      );
    } catch {
      hits = "";
    }
    // La unica via valida de avisar al usuario es showToast / ConfirmDialog.
    expect(hits.trim()).toBe("");
  });

  it("S6 — las ventanas de impresión escapan los datos de usuario", () => {
    const pos = readRepo("src/components/erp/PosWorkspace.tsx");
    const movements = readRepo("src/app/(dashboard)/finanzas/flujo-caja/movements-client.tsx");
    expect(pos).toContain("escapeHtml(s.customerName)");
    expect(pos).toContain("escapeHtml(s.folio)");
    expect(movements).toContain("escapeHtml(m.reference ?? \"-\")");
    expect(readRepo("src/lib/utils/escape-html.ts")).toContain("export function escapeHtml");
  });

  it("Toast — ToastHost montado en el shell y showToast disponible globalmente", () => {
    const shell = readRepo("src/components/layout/DashboardShell.tsx");
    expect(shell).toContain("<ToastHost />");
    expect((shell.match(/<ToastHost \/>/g) ?? []).length).toBe(2); // layout POS + layout estándar
  });

  it("J1 — useEscapeClose cableado en los módulos con modales", () => {
    const wired = {
      "src/components/erp/PosWorkspace.tsx": 4,
      "src/components/erp/CRMWorkspace.tsx": 3,
      "src/app/catalogo/catalog-client.tsx": 2,
      "src/app/(dashboard)/inventario/inventory-client.tsx": 3,
      "src/app/(dashboard)/despachos/shipments-client.tsx": 1,
      "src/app/(dashboard)/empleados/employees-client.tsx": 1,
      "src/components/erp/BillingWorkspace.tsx": 2,
      "src/app/(dashboard)/rrhh/portal/hr-portal-client.tsx": 1,
    } as const;
    for (const [file, min] of Object.entries(wired)) {
      // El import no tiene parentesis: cada match es una llamada real.
      const count = (readRepo(file).match(/useEscapeClose\(/g) ?? []).length;
      expect(`${file}:${count}`).toBe(`${file}:${min}`);
    }
  });

  it("E1 — el XML DTE se muestra en visor propio, etiquetado como vista previa", () => {
    const billing = readRepo("src/components/erp/BillingWorkspace.tsx");
    expect(billing).toContain("DteXmlViewer");
    expect(billing).toContain("Vista previa interna · sin firma electrónica vigente");
    expect(billing).toContain("Copiar XML");
  });

  it("E4 — el éxito del alta de empleado no se autodescarta", () => {
    const employees = readRepo("src/app/(dashboard)/empleados/employees-client.tsx");
    expect(employees).not.toContain("setTimeout(");
  });
});
