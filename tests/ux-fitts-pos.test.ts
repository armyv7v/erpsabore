import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Regresión estática PR-D (audit laws-of-ux 2026-09-13, Fitts F1-F9, F11, F13/F16/F20/F27, F28):
// los targets táctiles de POS/paginaciones no deben volver a encoger por debajo de 44px.
function readRepo(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), "utf8");
}

describe("Fase PR-D — targets táctiles 44px (regresión estática)", () => {
  const FILES = {
    pos: "src/components/erp/PosWorkspace.tsx",
    billing: "src/components/erp/BillingWorkspace.tsx",
    inventory: "src/app/(dashboard)/inventario/inventory-client.tsx",
    catalog: "src/app/catalogo/catalog-client.tsx",
    movements: "src/app/(dashboard)/finanzas/flujo-caja/movements-client.tsx",
    shell: "src/components/layout/DashboardShell.tsx",
    navbar: "src/components/layout/Navbar.tsx",
    css: "src/app/globals.css",
  } as const;

  it("F1/F2/F3 — steppers de POS sin targets de 14-22px", () => {
    const pos = readRepo(FILES.pos);
    expect(pos).not.toContain("p-0.5 rounded bg-white"); // stepper tarjeta producto (viejo)
    expect(pos).not.toContain('<Minus className="w-2.5 h-2.5" />');
    expect(pos).not.toContain('<Plus className="w-2.5 h-2.5" />');
    expect(pos).toContain("w-11 h-11 flex items-center justify-center rounded bg-white"); // steppers tarjeta
    expect((pos.match(/w-11 h-11 flex items-center justify-center rounded-lg border border-slate-250/g) ?? []).length).toBe(2); // steppers carrito
  });

  it("F5/F6 — montos rápidos y billetes con min-h 44px", () => {
    const pos = readRepo(FILES.pos);
    expect(pos).toContain("min-h-11 py-1 rounded-xl border text-xs font-extrabold"); // grid billetes
    expect(pos).toContain("min-w-[80px] min-h-11"); // dropdown de efectivo
  });

  it("F9 — las X de los 4 modales de POS miden 44px", () => {
    const pos = readRepo(FILES.pos);
    expect(pos).not.toContain("p-1.5 rounded-full hover:bg-slate-100");
    expect(pos).not.toContain("p-1 rounded-full hover:bg-slate-100");
    expect((pos.match(/w-11 h-11 flex items-center justify-center rounded-full/g) ?? []).length).toBe(4);
  });

  it("F13/F16/F20/F27 — paginaciones usan la clase compartida ux-touch-target", () => {
    const css = readRepo(FILES.css);
    expect(css).toContain(".ux-touch-target");
    expect(css).toContain("2.75rem"); // 44px
    for (const f of [FILES.billing, FILES.inventory, FILES.catalog, FILES.movements]) {
      expect(readRepo(f)).toContain("ux-touch-target");
    }
  });

  it("F11/F28 — tirador de sidebar y papelera de notificaciones ampliados", () => {
    const shell = readRepo(FILES.shell);
    expect(shell).not.toContain("w-3.5 h-16");
    expect(shell).toContain("w-8 h-24");
    const navbar = readRepo(FILES.navbar);
    expect(navbar).toContain("min-w-11 min-h-11");
  });
});
