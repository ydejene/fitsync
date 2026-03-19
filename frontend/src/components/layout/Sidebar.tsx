// src/components/layout/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/types";
import { clientFetch } from "@/lib/api";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "fa-gauge-high",
    roles: ["ADMIN", "STAFF", "MEMBER"],
  },
  {
    label: "Members",
    href: "/members",
    icon: "fa-users",
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Memberships",
    href: "/memberships",
    icon: "fa-id-card",
    roles: ["ADMIN", "STAFF", "MEMBER"],
  },
  {
    label: "Payments",
    href: "/payments",
    icon: "fa-money-bill-wave",
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Classes",
    href: "/bookings",
    icon: "fa-calendar-days",
    roles: ["ADMIN", "STAFF", "MEMBER"],
  },
  {
    label: "Staff",
    href: "/staff",
    icon: "fa-user-tie",
    roles: ["ADMIN"],
  },
  {
    label: "Insights",
    href: "/insights",
    icon: "fa-chart-pie",
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: "fa-chart-line",
    roles: ["ADMIN"],
  },
  {
    label: "Audit Log",
    href: "/audit",
    icon: "fa-shield-halved",
    roles: ["ADMIN"],
  },
];

interface Props {
  role: Role;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ role, open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const visible = navItems.filter((item) =>
    item.roles.includes(role)
  );

  async function handleLogout() {
    await clientFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Backdrop — mobile only */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E5E5E5] flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0 lg:shrink-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#E5E5E5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#F15A24] rounded-lg flex items-center justify-center shrink-0">
              <i className="fa-solid fa-dumbbell text-white text-xs" />
            </div>
            <span className="font-[family-name:var(--font-barlow)] text-lg font-bold text-[#1A1A1A]">FitSync</span>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[#6B6B6B] hover:bg-[#F5F5F5]"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visible.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                  ${isActive
                    ? "bg-[#FFF0EB] text-[#F15A24] font-semibold"
                    : "text-[#6B6B6B] hover:bg-[#F9FAFB] hover:text-[#1A1A1A]"}
                `}
              >
                <div className="w-6 flex justify-center items-center">
                  <i className={`fa-solid ${item.icon} text-sm ${isActive ? "text-[#F15A24]" : "text-[#9CA3AF] group-hover:text-[#1A1A1A]"}`} />
                </div>
                <span className="text-[14px] leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center text-sm" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}