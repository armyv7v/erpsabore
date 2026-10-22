"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import ToastHost from "@/components/ui/toast";
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
      <div className="flex h-screen items-center justify-center bg-frame text-[13px] text-muted">
        Redirigiendo a tu panel autorizado…
      </div>
    );
  }

  // El POS se trabaja a pantalla completa, con el sidebar fuera del flujo.
  const isPosPage = pathname === "/pos";

  if (isPosPage) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-white text-ink">
        <div
          onMouseEnter={() => setIsPosSidebarHovered(true)}
          aria-hidden="true"
          className="fixed bottom-0 left-0 top-0 z-40 w-8 cursor-e-resize bg-transparent"
        />

        {!isPosSidebarHovered && (
          <button
            type="button"
            onClick={() => setIsPosSidebarHovered(true)}
            onMouseEnter={() => setIsPosSidebarHovered(true)}
            aria-label="Abrir navegación"
            className="fixed left-0 top-1/2 z-30 flex w-8 h-24 -translate-y-1/2 items-center justify-center rounded-r-control bg-frame text-muted transition-colors hover:text-ink"
          >
            <span aria-hidden="true" className="text-[11px]">›</span>
          </button>
        )}

        <div
          onMouseLeave={() => setIsPosSidebarHovered(false)}
          className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 ${
            isPosSidebarHovered ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar user={user} />
        </div>

        <main className="h-full w-full overflow-hidden">
          {children}
        </main>
        <ToastHost />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-frame text-ink">
      <Sidebar user={user} />

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú lateral"
            className="absolute inset-0 bg-slate-950/30"
            onClick={() => setIsSidebarOpen(false)}
          />
          <Sidebar user={user} mode="mobile" onNavigate={() => setIsSidebarOpen(false)} />
        </div>
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="min-h-0 flex-1 pb-0 pr-0 md:pb-2 md:pr-2">
          <div className="h-full overflow-y-auto rounded-none border-0 border-border bg-white md:rounded-card md:border">
            {children}
            <div className="h-14 md:hidden" />
          </div>
        </div>
      </main>

      <MobileNav user={user} />
      <ToastHost />
    </div>
  );
}
