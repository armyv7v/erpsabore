import React from "react";
import Link from "next/link";
import { mobileNavigation } from "@/lib/navigation";
import type { AuthUser } from "@/lib/types/erp";

export default function MobileNav({ user }: { user: AuthUser }) {
  const items = mobileNavigation.filter((item) => item.roles.includes(user.role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:hidden flex justify-around p-2 z-50">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-slate-500 hover:text-primary transition-colors">
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
