"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function GlobalLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stop loading whenever the pathname or search parameters change
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external links, mailto, tel, hashes, and same page navigation
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        anchor.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      // Resolve absolute href to check if it's the current page
      const targetUrl = new URL(href, window.location.href);
      const currentUrl = new URL(window.location.href);

      // If it's the same page, ignore
      if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
        return;
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Add a small delay (120ms) before showing the loader to avoid flashing on instant transitions
      timeoutRef.current = setTimeout(() => {
        setLoading(true);
      }, 120);
    };

    // Also monitor forms submitting to show loader (e.g. Salir/Logout)
    const handleFormSubmit = (event: Event) => {
      if (event.defaultPrevented) {
        return;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (event.defaultPrevented) return;
        setLoading(true);
      }, 50); // Faster trigger for actions/form submissions
    };

    document.addEventListener("click", handleAnchorClick);
    document.addEventListener("submit", handleFormSubmit);
    
    return () => {
      document.removeEventListener("click", handleAnchorClick);
      document.removeEventListener("submit", handleFormSubmit);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/20 backdrop-blur-[1.5px] animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/90 dark:bg-[#221610]/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-10 rounded-full border border-primary/20 bg-primary/5 animate-ping opacity-75" />
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-350 tracking-wide select-none">
          Cargando...
        </span>
      </div>
    </div>
  );
}
