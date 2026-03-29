// src/app/(auth)/admin/layout.tsx
// Admin-only layout — redirects non-admins immediately

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminShell from "./AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/insights");

  return <AdminShell user={session}>{children}</AdminShell>;
}
