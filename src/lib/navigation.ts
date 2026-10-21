import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Banknote,
  Briefcase,
  Building2,
  FileText,
  Grid2X2,
  LayoutDashboard,
  LineChart,
  Package,
  PackageOpen,
  Percent,
  PieChart,
  Receipt,
  Store,
  Truck,
  UserCircle,
  UserCog,
  Users,
  Wallet,
  Settings,
  TrendingUp,
} from "lucide-react";
import type { AppRole } from "@/lib/types/erp";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: AppRole[];
}

export interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Inicio", icon: LayoutDashboard, roles: ["admin", "ventas", "finanzas", "bodega", "rrhh", "cliente"] },
      { href: "/pos", label: "Punto de Venta (POS)", icon: Store, roles: ["admin", "ventas"] },
      { href: "/ventas", label: "Ventas", icon: Wallet, roles: ["admin", "ventas", "finanzas", "cliente"] },
      { href: "/cotizaciones", label: "Cotizaciones", icon: FileText, roles: ["admin", "ventas"] },
      { href: "/inventario", label: "Inventario", icon: Package, roles: ["admin", "bodega"] },
      { href: "/catalogo", label: "Catálogo", icon: Grid2X2, roles: ["admin", "ventas", "bodega", "cliente"] },
      { href: "/reportes", label: "Reportes", icon: TrendingUp, roles: ["admin", "ventas", "finanzas", "bodega", "rrhh"] },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { href: "/proveedores", label: "Proveedores", icon: Truck, roles: ["admin", "finanzas", "bodega"] },
      { href: "/despachos", label: "Despachos", icon: PackageOpen, roles: ["admin", "ventas", "bodega", "cliente"] },
      { href: "/crm", label: "CRM", icon: Users, roles: ["admin", "ventas"] },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { href: "/facturacion", label: "Facturación", icon: Receipt, roles: ["admin", "ventas", "finanzas"] },
      { href: "/finanzas/flujo-caja", label: "Flujo de Caja", icon: LineChart, roles: ["admin", "finanzas"] },
      { href: "/finanzas/conciliacion", label: "Conciliación", icon: ArrowRightLeft, roles: ["admin", "finanzas"] },
      { href: "/finanzas/estado-resultados", label: "Estado de Resultados", icon: PieChart, roles: ["admin", "finanzas"] },
      { href: "/finanzas/impuestos", label: "Impuestos", icon: Percent, roles: ["admin", "finanzas"] },
    ],
  },
  {
    label: "Recursos Humanos",
    items: [
      { href: "/empleados", label: "Empleados", icon: Briefcase, roles: ["admin", "rrhh"] },
      { href: "/rrhh/nomina", label: "Nómina", icon: Banknote, roles: ["admin", "rrhh", "finanzas"] },
      { href: "/rrhh/portal", label: "Portal Empleado", icon: UserCircle, roles: ["admin", "rrhh"] },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/sucursales", label: "Sucursales", icon: Building2, roles: ["admin"] },
      { href: "/usuarios", label: "Usuarios", icon: UserCog, roles: ["admin"] },
      { href: "/configuracion", label: "Configuración Empresa", icon: Settings, roles: ["admin"] },
    ],
  },
];

export const mobileNavigation = [
  { href: "/", label: "Inicio", icon: LayoutDashboard, roles: ["admin", "ventas", "finanzas", "bodega", "rrhh", "cliente"] },
  { href: "/pos", label: "POS", icon: Store, roles: ["admin", "ventas"] },
  { href: "/ventas", label: "Ventas", icon: Wallet, roles: ["admin", "ventas", "finanzas", "cliente"] },
  { href: "/facturacion", label: "Facturas", icon: Receipt, roles: ["admin", "ventas", "finanzas"] },
  { href: "/inventario", label: "Inventario", icon: Package, roles: ["admin", "bodega"] },
];

/**
 * The name the shell shows for a screen. It is the one h1 of every page, so it has to
 * say what the screen is, not repeat the product name. Sentence case, no trailing colon.
 */
const screenTitles: Record<string, string> = {
  "/": "Resumen",
  "/pos": "Punto de venta",
  "/ventas": "Ventas",
  "/cotizaciones": "Cotizaciones",
  "/inventario": "Inventario",
  "/catalogo": "Catálogo",
  "/reportes": "Reportes",
  "/proveedores": "Proveedores",
  "/despachos": "Despachos",
  "/crm": "CRM",
  "/facturacion": "Facturación",
  "/finanzas/flujo-caja": "Flujo de caja",
  "/finanzas/conciliacion": "Conciliación",
  "/finanzas/estado-resultados": "Estado de resultados",
  "/finanzas/impuestos": "Impuestos",
  "/empleados": "Empleados",
  "/rrhh/nomina": "Nómina",
  "/rrhh/portal": "Portal del empleado",
  "/sucursales": "Sucursales",
  "/usuarios": "Usuarios",
  "/configuracion": "Configuración de la empresa",
};

export function screenTitle(pathname: string): string {
  const exact = screenTitles[pathname];
  if (exact) {
    return exact;
  }

  const parent = Object.keys(screenTitles)
    .filter((href) => href !== "/" && pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return parent ? screenTitles[parent] : "Panel";
}
