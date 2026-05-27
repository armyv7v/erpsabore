"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { canAccessPath } from "@/lib/access-control";
import type { AuthUser } from "@/lib/types/erp";

interface DashboardShellProps {
  user: AuthUser;
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPosSidebarHovered, setIsPosSidebarHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!canAccessPath(user.role, pathname)) {
      router.replace("/");
    }
  }, [pathname, router, user.role]);

  if (!canAccessPath(user.role, pathname)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light text-slate-600 dark:bg-background-dark dark:text-slate-300">
        Redirigiendo a tu panel autorizado...
      </div>
    );
  }

  // Si es la página del POS, aislamos el layout con Sidebar hoverable/desplegable
  const isPosPage = pathname === "/pos";

  if (isPosPage) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 relative">
        {/* Strip sensible al hover en el extremo izquierdo */}
        <div 
          onMouseEnter={() => setIsPosSidebarHovered(true)}
          className="fixed left-0 top-0 bottom-0 w-3.5 z-40 bg-transparent cursor-e-resize"
        />

        {/* Tirador visual discreto para pantallas táctiles y guía de usuario */}
        {!isPosSidebarHovered && (
          <button
            type="button"
            onClick={() => setIsPosSidebarHovered(true)}
            onMouseEnter={() => setIsPosSidebarHovered(true)}
            className="fixed left-0 top-1/2 -translate-y-1/2 bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 w-3.5 h-16 rounded-r-lg z-30 flex items-center justify-center transition-all opacity-30 hover:opacity-100"
          >
            <span className="text-[10px] font-extrabold">›</span>
          </button>
        )}

        {/* Sidebar flotante con transición suave y sombra elegante */}
        <div
          onMouseLeave={() => setIsPosSidebarHovered(false)}
          className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 transform ${
            isPosSidebarHovered ? "translate-x-0 shadow-[10px_0_30px_rgba(0,0,0,0.15)]" : "-translate-x-full"
          }`}
        >
          <Sidebar user={user} />
        </div>

        {/* Contenido POS en pantalla completa */}
        <main className="h-full w-full overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <Sidebar user={user} />

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" aria-hidden="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
            onClick={() => setIsSidebarOpen(false)}
          />
          <Sidebar user={user} mode="mobile" onNavigate={() => setIsSidebarOpen(false)} />
        </div>
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          {children}
          <div className="h-16 md:hidden"></div>
        </div>
      </main>

      <MobileNav user={user} />
    </div>
  );
}
