"use client";

import dynamic from "next/dynamic";

const LivingLandingClient = dynamic(
  () => import("@/components/landing/LivingLandingClient"),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-[#1c110b] text-[#f8f6f6] flex items-center justify-center">
        <div className="login-dot-live" />
      </main>
    ),
  }
);

export default function LoginPage() {
  return <LivingLandingClient />;
}
