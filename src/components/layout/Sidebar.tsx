"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, X } from "lucide-react";
import { navigationSections } from "@/lib/navigation";
import type { AuthUser } from "@/lib/types/erp";

interface SidebarProps {
  user: AuthUser;
  mode?: "desktop" | "mobile";
  onNavigate?: () => void;
}

export default function Sidebar({ user, mode = "desktop", onNavigate }: SidebarProps) {
  const isMobile = mode === "mobile";
  const pathname = usePathname();

  return (
    <aside
      className={
        isMobile
          ? "absolute inset-y-0 left-0 z-50 flex w-[min(85vw,18rem)] flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 md:hidden"
          : "hidden w-64 h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex"
      }
    >
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Store className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">ERP Sabore</span>
        </div>
        {isMobile ? (
          <button
            type="button"
            aria-label="Cerrar menu lateral"
            onClick={onNavigate}
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        {navigationSections.map((section) => {
          const items = section.items.filter((item) => item.roles.includes(user.role));

          if (items.length === 0) {
            return null;
          }

          return (
            <div key={section.label}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4 px-2">
                {section.label}
              </div>
              {items.map((item) => {
                const Icon = item.icon;
                // Un item está activo si el pathname actual coincide exactamente o si es una subruta (excepto para la raíz '/')
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-semibold shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      }`}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{user.fullName}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role} · {user.tenantName}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

