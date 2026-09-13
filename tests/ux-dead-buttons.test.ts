import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Regresión estática PR-C (audit laws-of-ux 2026-09-13, hallazgos J3-J10 y D1):
// los controles muertos eliminados no deben volver a aparecer sin onClick,
// y el botón "Confirmar Pago y Emitir DTE" debe quedar disabled durante isPending.
function readSrc(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), "utf8");
}

describe("Fase PR-C — botones muertos eliminados (regresión estática)", () => {
  const FILES = {
    pos: "src/components/erp/PosWorkspace.tsx",
    catalog: "src/app/catalogo/catalog-client.tsx",
    shipments: "src/app/(dashboard)/despachos/shipments-client.tsx",
    employees: "src/app/(dashboard)/empleados/employees-client.tsx",
  } as const;

  it("J9/J10 — el filtro Almacén (que no filtraba) no existe en POS ni catálogo", () => {
    const pos = readSrc(FILES.pos);
    const catalog = readSrc(FILES.catalog);
    expect(pos).not.toContain("Dropdown Almacén");
    expect(catalog).not.toContain("Dropdown Almacén");
    expect(catalog).not.toContain("MOCK_BRANCHES");
    expect(pos).not.toContain("activeBranch");
    expect(catalog).not.toContain("activeBranch");
  });

  it("J3/J4/J5 — despachos no tiene botones Filtros/Fecha/POD sin handler", () => {
    const src = readSrc(FILES.shipments);
    expect(src).not.toContain(">Filtros</span>");
    expect(src).not.toContain(">Fecha</span>");
    expect(src).not.toContain("<span>POD</span>");
  });

  it("J6/J7 — empleados no tiene menú fantasma ni foto sin input", () => {
    const src = readSrc(FILES.employees);
    expect(src).not.toContain("MoreVertical");
    expect(src).not.toContain('cursor-pointer hover:border-primary transition-colors">\n');
  });

  it("J8 — el buscador de catálogo no tiene botón Filtrar redundante", () => {
    const src = readSrc(FILES.catalog);
    expect(src).not.toContain("Filtrar");
  });

  it("D1 — Confirmar Pago y Emitir DTE queda disabled durante isPending", () => {
    const src = readSrc(FILES.pos);
    const buttonStart = src.indexOf("onClick={executeProcessSale}");
    expect(buttonStart).toBeGreaterThan(-1);
    const window = src.slice(buttonStart, buttonStart + 800);
    expect(window).toContain("disabled={isPending}");
    expect(window).toContain("Emitiendo...");
  });
});
