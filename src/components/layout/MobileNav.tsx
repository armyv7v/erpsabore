import React from "react";
import Link from "next/link";
import { mobileNavigation } from "@/lib/navigation";
import type { AuthUser } from "@/lib/types/erp";

export default function MobileNav({ user }: { user: AuthUser }) {
  const items = mobileNavigation.filter((item) => item.roles.includes(user.role));

  return (
    <nav
      aria-label="Navegación rápida"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-edge bg-frame pb-1 pt-1.5 md:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-control px-2 text-slate-600 transition-colors hover:text-ink"
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-[11px] font-medium leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
