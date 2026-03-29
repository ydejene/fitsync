"use client";

// AdminShell — FitSync Admin Console chrome
// Light theme — matching the core brand identity

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/types";
import { clientFetch } from "@/lib/api";

const adminNavItems = [
  { label: "Overview",  href: "/admin",         icon: "fa-gauge-high" },
  { label: "All Gyms", href: "/admin/gyms",     icon: "fa-building" },
  { label: "Revenue",  href: "/admin/revenue",  icon: "fa-coins" },
];

interface Props {
  user: AuthUser;
  children: React.ReactNode;
}

export default function AdminShell({ user, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await clientFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-[#E5E5E5]
          transform transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0 lg:shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-100">
          <img src="/logo.png" alt="FitSync Logo" className="h-8 md:h-10 w-auto object-contain" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Admin Navigation">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive
                    ? "bg-[#FFF0EB] text-[#F15A24]"
                    : "text-[#6B6B6B] hover:bg-[#F8F8F8] hover:text-[#1A1A1A]"}
                `}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#F15A24] rounded-r-full"
                  />
                )}
                <i
                  className={`fa-solid ${item.icon} text-sm w-5 text-center ${isActive ? "text-[#F15A24]" : "text-[#9CA3AF] group-hover:text-[#1A1A1A]"}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="pt-4 mt-2 border-t border-[#E5E5E5]">
            <Link
              href="/insights"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#6B6B6B] hover:bg-[#F8F8F8] hover:text-[#1A1A1A] transition-all duration-200"
            >
              <i className="fa-solid fa-arrow-left text-sm w-5 text-center text-[#9CA3AF]" />
              <span>Back to App</span>
            </Link>
          </div>
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-[#E5E5E5]">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1 group">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold bg-[#F15A24]"
            >
              {user.fullName?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate text-[#1A1A1A]">
                {user.fullName}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#F15A24]">
                Super Admin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center text-sm" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="h-16 px-5 flex items-center justify-between shrink-0 bg-white border-b border-[#E5E5E5]"
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] transition text-[#6B6B6B]"
          >
            <i className="fa-solid fa-bars text-sm" />
          </button>

          <div className="hidden lg:flex items-center gap-3 text-sm text-[#9CA3AF]">
            <img src="/logo.png" alt="" className="h-5 w-auto object-contain" />
            <span>FitSync Admin Console</span>
          </div>

          <span
            className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFF0EB] text-[#F15A24] border border-[#F15A24]/20"
          >
            Super Admin
          </span>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
