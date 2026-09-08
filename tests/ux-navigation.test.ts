import { describe, it, expect } from "vitest";
import type { LucideIcon } from "lucide-react";
import { mobileNavigation, navigationSections } from "@/lib/navigation";
import type { AppRole } from "@/lib/types/erp";

const ROLES: AppRole[] = ["admin", "ventas", "finanzas", "bodega", "rrhh", "cliente"];

function hrefsForRole(role: AppRole): string[] {
  return navigationSections.flatMap((section) =>
    section.items.filter((item) => item.roles.includes(role)).map((item) => item.href),
  );
}

function rolesForHref(href: string): AppRole[] {
  const all = navigationSections.flatMap((section) => section.items);
  const found = all.find((item) => item.href === href);
  return found ? [...found.roles].sort() : [];
}

function iconName(icon: LucideIcon, fallback: string): string {
  return (icon as unknown as { displayName?: string }).displayName ?? fallback;
}

// 5.2 — regresión de navegación por rol contra la matriz REQ-NC-02.
// Criterio: cero hrefs perdidos/ganados por rol (HEAD-vs-WORK como test).
// No toca la matriz en código: sólo la verifica.
describe("Fase 5.2 — matriz REQ-NC-02 por rol (cero pérdida de permisos)", () => {
  // Matriz del spec: cada href conserva su set de roles aunque cambie de sección.
  const MATRIX: Record<string, AppRole[]> = {
    "/": ["admin", "ventas", "finanzas", "bodega", "rrhh", "cliente"],
    "/pos": ["admin", "ventas"],
    "/ventas": ["admin", "ventas", "finanzas", "cliente"],
    "/cotizaciones": ["admin", "ventas"],
    "/inventario": ["admin", "bodega"],
    "/catalogo": ["admin", "ventas", "bodega", "cliente"],
    "/crm": ["admin", "ventas"],
    "/reportes": ["admin", "ventas", "finanzas", "bodega", "rrhh"],
  };

  for (const [href, roles] of Object.entries(MATRIX)) {
    it(`${href} conserva sus roles [${roles.join(", ")}]`, () => {
      expect(rolesForHref(href)).toEqual([...roles].sort());
    });
  }

  it("Principal de admin muestra ≤7 ítems (Miller)", () => {
    const principal = navigationSections.find((section) => section.label === "Principal");
    expect(principal).toBeDefined();
    const adminItems = principal!.items.filter((item) => item.roles.includes("admin"));
    expect(adminItems.length).toBeLessThanOrEqual(7);
  });

  it("/crm vive en Operaciones (no en Principal) y sigue alcanzable", () => {
    const principal = navigationSections.find((section) => section.label === "Principal");
    const operaciones = navigationSections.find((section) => section.label === "Operaciones");
    expect(principal!.items.map((item) => item.href)).not.toContain("/crm");
    expect(operaciones!.items.map((item) => item.href)).toContain("/crm");
  });

  it("admin alcanza los 8 destinos (7 Principal + CRM en Operaciones)", () => {
    const principal = navigationSections.find((section) => section.label === "Principal");
    const adminHrefs = new Set(
      principal!.items.filter((item) => item.roles.includes("admin")).map((item) => item.href),
    );
    adminHrefs.add("/crm");
    expect(adminHrefs.size).toBe(8);
  });

  // Sets completos por rol: cualquier href perdido o ganado rompe el test.
  const FULL_SETS: Record<AppRole, string[]> = {
    admin: [
      "/", "/pos", "/ventas", "/cotizaciones", "/inventario", "/catalogo", "/reportes",
      "/proveedores", "/despachos", "/crm", "/facturacion",
      "/finanzas/flujo-caja", "/finanzas/conciliacion", "/finanzas/estado-resultados",
      "/finanzas/impuestos", "/empleados", "/rrhh/nomina", "/rrhh/portal",
      "/sucursales", "/usuarios", "/configuracion",
    ],
    ventas: ["/", "/pos", "/ventas", "/cotizaciones", "/catalogo", "/reportes", "/despachos", "/crm", "/facturacion"],
    finanzas: [
      "/", "/ventas", "/reportes", "/proveedores", "/facturacion",
      "/finanzas/flujo-caja", "/finanzas/conciliacion", "/finanzas/estado-resultados",
      "/finanzas/impuestos", "/rrhh/nomina",
    ],
    bodega: ["/", "/inventario", "/catalogo", "/reportes", "/proveedores", "/despachos"],
    rrhh: ["/", "/reportes", "/empleados", "/rrhh/nomina", "/rrhh/portal"],
    cliente: ["/", "/ventas", "/catalogo", "/despachos"],
  };

  for (const role of ROLES) {
    it(`set completo de hrefs para rol ${role} (cero pérdida/ganancia)`, () => {
      expect(hrefsForRole(role).sort()).toEqual([...FULL_SETS[role]].sort());
    });
  }

  it("navegación móvil conserva hrefs y roles (mirror de desktop)", () => {
    const mobileByHref = new Map(mobileNavigation.map((item) => [item.href, [...item.roles].sort()]));
    expect(mobileByHref.get("/")).toEqual(["admin", "bodega", "cliente", "finanzas", "rrhh", "ventas"]);
    expect(mobileByHref.get("/pos")).toEqual(["admin", "ventas"]);
    expect(mobileByHref.get("/ventas")).toEqual(["admin", "cliente", "finanzas", "ventas"]);
    expect(mobileByHref.get("/facturacion")).toEqual(["admin", "finanzas", "ventas"]);
    expect(mobileByHref.get("/inventario")).toEqual(["admin", "bodega"]);
  });
});

describe("Fase 5.2 — un icono por función (REQ-NC-01, desktop + móvil)", () => {
  it("ningún icono mapea dos funciones distintas", () => {
    const byIcon = new Map<LucideIcon, Set<string>>();
    const labels = new Map<LucideIcon, Set<string>>();
    for (const item of [...navigationSections.flatMap((s) => s.items), ...mobileNavigation]) {
      if (!byIcon.has(item.icon)) {
        byIcon.set(item.icon, new Set());
        labels.set(item.icon, new Set());
      }
      byIcon.get(item.icon)!.add(item.href);
      labels.get(item.icon)!.add(item.label);
    }

    const collisions = [...byIcon.entries()].filter(([, hrefs]) => hrefs.size > 1);
    expect(
      collisions.map(([icon, hrefs]) => `${iconName(icon, "?")}: ${[...hrefs].join(", ")}`),
    ).toEqual([]);
  });
});

describe("Fase 5.2 — CTA único por vista (Von Restorff)", () => {
  it("LoginForm expone exactamente un submit", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(join(process.cwd(), "src/components/auth/LoginForm.tsx"), "utf8");
    expect(src.match(/type="submit"/g)?.length ?? 0).toBe(1);
  });

  it("ForgotPasswordForm expone exactamente un submit", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(join(process.cwd(), "src/components/auth/ForgotPasswordForm.tsx"), "utf8");
    expect(src.match(/type="submit"/g)?.length ?? 0).toBe(1);
  });

  it("UpdatePasswordForm expone exactamente un submit", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(join(process.cwd(), "src/components/auth/UpdatePasswordForm.tsx"), "utf8");
    expect(src.match(/type="submit"/g)?.length ?? 0).toBe(1);
  });

  it("empty-state cliente expone exactamente un CTA a /catalogo (REQ-NC-03)", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(join(process.cwd(), "src/app/(dashboard)/page.tsx"), "utf8");
    // Acotado al bloque empty-state (otras vistas por rol tienen sus propios links).
    const anchor = "Aún no registra compras";
    const emptyState = src.slice(src.indexOf(anchor), src.indexOf(anchor) + 800);
    expect(emptyState.match(/href="\/catalogo"/g)?.length ?? 0).toBe(1);
    expect(emptyState).toContain("Explorar catálogo");
  });
});
