// src/app/(dashboard)/layout.tsx
// Dashboard layout with subscription enforcement for OWNER users

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // For OWNER users: check if subscription is active
  if (session.role === "OWNER") {
    try {
      const userData = await apiFetch("/api/auth/me");
      const user = userData?.data?.user;
      if (user && user.subscriptionStatus !== "active") {
        redirect("/subscribe");
      }
    } catch {
      // If API call fails, allow access (don't block on API errors)
    }
  }

  return (
    <DashboardShell user={session}>
      {children}
    </DashboardShell>
  );
}