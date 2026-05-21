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
