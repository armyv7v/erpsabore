"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { navigationSections } from "@/lib/navigation";
import type { AuthUser } from "@/lib/types/erp";

interface SidebarProps {
  user: AuthUser;
  mode?: "desktop" | "mobile";
  onNavigate?: () => void;
}

const roleLabels: Record<string, string> = {
  admin: "Administración",
  ventas: "Ventas",
  finanzas: "Finanzas",
  bodega: "Bodega",
  rrhh: "Recursos humanos",
  cliente: "Cliente",
};

export default function Sidebar({ user, mode = "desktop", onNavigate }: SidebarProps) {
  const isMobile = mode === "mobile";
  const pathname = usePathname();

  return (
    <aside
      aria-label="Navegación principal"
      className={
        isMobile
          ? "absolute inset-y-0 left-0 z-50 flex w-[min(85vw,264px)] flex-col bg-frame md:hidden"
          : "hidden h-full w-[232px] shrink-0 flex-col bg-frame md:flex"
      }
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" onClick={onNavigate} className="flex items-center">
          <Image
            src="/brand/logo_camel_sin_fondo.png"
            alt="Saboré Insumos"
            width={132}
            height={32}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
        {isMobile ? (
          <button
            type="button"
            aria-label="Cerrar menú lateral"
            onClick={onNavigate}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-control text-muted transition-colors hover:bg-slate-900/[0.06] hover:text-ink focus-visible:outline-primary"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {navigationSections.map((section) => {
          const items = section.items.filter((item) => item.roles.includes(user.role));
          if (items.length === 0) return null;

          return (
            <div key={section.label} className="mt-2.5 first:mt-0.5">
              <p className="px-3 pb-1 text-[12px] font-medium text-muted">{section.label}</p>
              <ul>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  let label = item.label;
                  if (user.role === "cliente") {
                    if (item.href === "/ventas") label = "Mis pedidos";
                    else if (item.href === "/despachos") label = "Mis despachos";
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex h-8 items-center gap-2.5 rounded-control px-3 text-[13px] transition-colors ${
                          isActive
                            ? "bg-slate-900/[0.07] font-medium text-ink"
                            : "text-muted hover:bg-slate-900/[0.04] hover:text-ink"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-edge px-4 py-3">
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900/[0.07] text-[11px] font-semibold text-ink"
        >
          {user.fullName.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">{user.fullName}</p>
          <p className="truncate text-[11px] text-muted">
            {roleLabels[user.role] ?? user.role} · {user.tenantName}
          </p>
        </div>
      </div>
    </aside>
  );
}
