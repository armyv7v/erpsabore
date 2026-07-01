import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Briefcase,
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
      { href: "/", label: "Inicio", icon: LayoutDashboard, roles: ["admin", "ventas", "finanzas", "bodega", "rrhh"] },
      { href: "/pos", label: "Punto de Venta (POS)", icon: Store, roles: ["admin", "ventas"] },
      { href: "/ventas", label: "Ventas", icon: Wallet, roles: ["admin", "ventas", "finanzas"] },
      { href: "/cotizaciones", label: "Cotizaciones", icon: FileText, roles: ["admin", "ventas"] },
      { href: "/inventario", label: "Inventario", icon: Package, roles: ["admin", "bodega"] },
      { href: "/catalogo", label: "Catálogo", icon: Grid2X2, roles: ["admin", "ventas", "bodega"] },
      { href: "/crm", label: "CRM", icon: Users, roles: ["admin", "ventas"] },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { href: "/proveedores", label: "Proveedores", icon: Truck, roles: ["admin", "finanzas", "bodega"] },
      { href: "/despachos", label: "Despachos", icon: PackageOpen, roles: ["admin", "ventas", "bodega"] },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { href: "/facturacion", label: "Facturación", icon: FileText, roles: ["admin", "ventas", "finanzas"] },
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
      { href: "/rrhh/nomina", label: "Nómina", icon: Receipt, roles: ["admin", "rrhh", "finanzas"] },
      { href: "/rrhh/portal", label: "Portal Empleado", icon: UserCircle, roles: ["admin", "rrhh"] },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/sucursales", label: "Sucursales", icon: Store, roles: ["admin"] },
      { href: "/usuarios", label: "Usuarios", icon: UserCog, roles: ["admin"] },
      { href: "/configuracion", label: "Configuración Empresa", icon: Settings, roles: ["admin"] },
    ],
  },
];

export const mobileNavigation = [
  { href: "/", label: "Inicio", icon: LayoutDashboard, roles: ["admin", "ventas", "finanzas", "bodega", "rrhh"] },
  { href: "/pos", label: "POS", icon: Store, roles: ["admin", "ventas"] },
  { href: "/ventas", label: "Ventas", icon: Wallet, roles: ["admin", "ventas", "finanzas"] },
  { href: "/facturacion", label: "Facturas", icon: FileText, roles: ["admin", "ventas", "finanzas"] },
  { href: "/inventario", label: "Inventario", icon: Package, roles: ["admin", "bodega"] },
];
