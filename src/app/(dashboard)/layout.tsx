import React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { requireAuthenticatedUser } from "@/lib/services/auth-service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthenticatedUser();

  return (
    <DashboardShell user={user}>{children}</DashboardShell>
  );
}
