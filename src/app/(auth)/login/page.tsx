"use client";

import dynamic from "next/dynamic";

const LivingLandingClient = dynamic(
  () => import("@/components/landing/LivingLandingClient"),
  {
    ssr: false,
    loading: () => (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f2f0]">
        <div className="size-6 animate-pulse rounded-full bg-[var(--color-primary)]/30" />
      </main>
    ),
  }
);

export default function LoginPage() {
  return <LivingLandingClient />;
}
