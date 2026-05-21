import type { AppRole } from "@/lib/types/erp";

const roleAllowedPrefixes: Record<AppRole, string[]> = {
  admin: ["/"],
  ventas: ["/", "/ventas", "/cotizaciones", "/facturacion", "/crm", "/catalogo", "/despachos"],
  finanzas: ["/", "/facturacion", "/finanzas", "/proveedores", "/rrhh/nomina", "/reportes"],
  bodega: ["/", "/inventario", "/catalogo", "/despachos", "/proveedores"],
  rrhh: ["/", "/empleados", "/rrhh", "/reportes"],
};

function normalizePath(pathname: string) {
  if (!pathname || pathname === "") {
    return "/";
  }

  return pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
}

export function canAccessPath(role: AppRole, pathname: string) {
  if (role === "admin") {
    return true;
  }

  const allowedPrefixes = roleAllowedPrefixes[role] ?? ["/"];
  const path = normalizePath(pathname);

  if (path === "/") {
    return true;
  }

  return allowedPrefixes.some((prefix) => {
    if (prefix === "/") {
      return false;
    }

    return path === prefix || path.startsWith(`${prefix}/`);
  });
}
