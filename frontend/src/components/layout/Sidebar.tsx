// src/components/layout/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/types";
import { clientFetch } from "@/lib/api";

const navItems = [
  {
    label: "Insights",
    href: "/insights",
    icon: "fa-chart-pie",
    roles: ["ADMIN", "OWNER", "STAFF"],
  },
  {
    label: "Profile",
    href: "/profile",
    icon: "fa-user-circle",
    roles: ["ADMIN", "OWNER", "STAFF", "MEMBER"],
  },
  {
    label: "Members",
    href: "/members",
    icon: "fa-users",
    roles: ["ADMIN", "OWNER", "STAFF"],
  },
  {
    label: "Memberships",
    href: "/memberships",
    icon: "fa-id-card",
    roles: ["ADMIN", "OWNER", "STAFF", "MEMBER"],
  },
  {
    label: "Payments",
    href: "/payments",
    icon: "fa-money-bill-wave",
    roles: ["ADMIN", "OWNER", "STAFF"],
  },
  {
    label: "Classes",
    href: "/bookings",
    icon: "fa-calendar-days",
    roles: ["ADMIN", "OWNER", "STAFF", "MEMBER"],
  },
  {
    label: "Staff",
    href: "/staff",
    icon: "fa-user-tie",
    roles: ["ADMIN", "OWNER"],
  },
  {
    label: "Audit Log",
    href: "/audit",
    icon: "fa-shield-halved",
    roles: ["ADMIN"],
  },
];

interface Props {
  user: AuthUser;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ user, open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const visible = navItems.filter((item) => {
    if (!item.roles.includes(user.role)) return false;

    if (user.role === "STAFF" && user.permissions) {
      if (item.label === "Members" && !user.permissions.canManageMembers) return false;
      if (item.label === "Memberships" && !user.permissions.canManagePlans) return false;
      if (item.label === "Payments" && !user.permissions.canManagePayments) return false;
      if (item.label === "Classes" && !user.permissions.canManageBookings) return false;
      if (item.label === "Insights" && !user.permissions.canViewReports) return false;
    }
    
    return true;
  });

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
          <Link href="/insights" className="flex items-center hover:opacity-85 transition-opacity cursor-pointer">
            <img src="/logo.png" alt="FitSync Logo" className="h-8 md:h-10 w-auto object-contain" />
          </Link>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            type="button"
            aria-label="Close dashboard navigation"
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[#6B6B6B] hover:bg-[#F5F5F5] cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {/* Admin-only return link — pinned at top */}
          {user.role === "ADMIN" && (
            <>
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all bg-[#F15A24]/10 text-[#F15A24] border border-[#F15A24]/20 hover:bg-[#F15A24]/15 mb-2"
              >
                <div className="w-6 flex justify-center items-center">
                  <i className="fa-solid fa-shield-halved text-sm text-[#F15A24]" />
                </div>
                <span className="text-[14px] leading-none">Admin Console</span>
                <i className="fa-solid fa-arrow-right text-[10px] ml-auto" />
              </Link>
              <div className="border-t border-[#E5E5E5] mb-2" />
            </>
          )}
          {visible.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group
                  ${isActive
                    ? "bg-[#FFF0EB] text-[#F15A24] font-semibold shadow-sm"
                    : "text-[#6B6B6B] hover:bg-[#F8F8F8] hover:text-[#1A1A1A] hover:translate-x-1"}
                `}
              >
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#F15A24] rounded-r-full shadow-sm" />}
                <div className="w-6 flex justify-center items-center">
                  <i className={`fa-solid ${item.icon} text-sm ${isActive ? "text-[#F15A24]" : "text-[#9CA3AF] group-hover:text-[#1A1A1A]"}`} />
                </div>
                <span className="text-[14px] leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-[#E5E5E5] space-y-2">
          {user.role === "OWNER" && (
            <a
              href="https://t.me/Niyo11"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all bg-[#0088cc]/10 text-[#0088cc] border border-[#0088cc]/20 hover:bg-[#0088cc]/15 mb-4"
            >
              <div className="w-5 flex justify-center items-center">
                <i className="fa-brands fa-telegram text-sm" />
              </div>
              <span>Request Member App</span>
            </a>
          )}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Securely Sign out"
            className="sidebar-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center text-sm" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
