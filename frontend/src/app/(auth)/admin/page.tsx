// src/app/(auth)/admin/page.tsx
// Admin super-dashboard — platform-level KPIs + recent gym list

import { requireAdmin } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import type { Metadata } from "next";
import GymStatusToggle from "./GymStatusToggle";

export const metadata: Metadata = { title: "Admin Console | FitSync" };

function formatETB(n: number) {
  return `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status, sub }: { status: string; sub: string }) {
  if (status === "INACTIVE")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-100">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        Deactivated
      </span>
    );
  if (sub === "active")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-50 text-green-600 border border-green-100">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Active
      </span>
    );
  if (sub === "pending")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-100">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-400 border border-gray-100">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      {sub ?? "—"}
    </span>
  );
}

export default async function AdminPage() {
  await requireAdmin();

  const result = await apiFetch("/api/admin/stats");
  const stats = result.success ? result.data : null;

  const kpis = stats
    ? [
        {
          label: "Total Gyms Signed Up",
          value: stats.totalGyms.toString(),
          icon: "fa-building",
          color: "text-[#F15A24] bg-[#FFF0EB] border-[#F15A24]/20",
          sub: `${stats.activeGyms} with active subscription`,
        },
        {
          label: "Active Subscribers",
          value: stats.activeGyms.toString(),
          icon: "fa-circle-check",
          color: "text-green-600 bg-green-50 border-green-200/50",
          sub: `${stats.pendingGyms} still pending`,
        },
        {
          label: "Revenue This Month",
          value: formatETB(stats.revenueThisMonth),
          icon: "fa-coins",
          color: "text-[#F15A24] bg-[#FFF0EB] border-[#F15A24]/20",
          sub:
            stats.revenueChange >= 0
              ? `+${stats.revenueChange}% vs last month`
              : `${stats.revenueChange}% vs last month`,
          subColor: stats.revenueChange >= 0 ? "text-green-600" : "text-red-500",
        },
        {
          label: "All-Time Revenue",
          value: formatETB(stats.revenueAllTime),
          icon: "fa-money-bill-trend-up",
          color: "text-orange-600 bg-orange-50 border-orange-200/50",
          sub: "From all subscriptions",
        },
        {
          label: "Pending Gyms",
          value: stats.pendingGyms.toString(),
          icon: "fa-hourglass-half",
          color: "text-yellow-600 bg-yellow-50 border-yellow-200/50",
          sub: "Signed up, not yet subscribed",
        },
        {
          label: "Deactivated Gyms",
          value: stats.inactiveGyms.toString(),
          icon: "fa-ban",
          color: "text-red-600 bg-red-50 border-red-200/50",
          sub: "Blocked by admin",
        },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight font-display">
          Platform Overview
        </h1>
        <p className="text-sm mt-1 text-[#6B6B6B]">
          Real-time stats across all gyms using FitSync
        </p>
      </div>

      {/* KPI Cards */}
      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="relative overflow-hidden rounded-2xl p-5 bg-white border border-[#E5E5E5] shadow-sm transition-all hover:shadow-md hover:border-[#F15A24]/30"
            >
              <div className="flex items-start justify-between relative">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">
                    {kpi.label}
                  </p>
                  <p className="text-3xl font-bold text-[#1A1A1A] tracking-tight leading-none font-display">
                    {kpi.value}
                  </p>
                  <p className={`text-xs mt-2 font-medium ${kpi.subColor ?? "text-[#9CA3AF]"}`}>
                    {kpi.sub}
                  </p>
                </div>

                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${kpi.color}`}
                >
                  <i className={`fa-solid ${kpi.icon} text-sm`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-6 text-sm bg-red-50 border border-red-200 text-red-600">
          <i className="fa-solid fa-triangle-exclamation mr-2" />
          Could not load platform stats. Check that the backend is running.
        </div>
      )}

      {/* Recent Gyms */}
      <div className="rounded-2xl bg-white border border-[#E5E5E5] shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-[#F0F0F0]">
          <div>
            <h2 className="text-base font-semibold text-[#1A1A1A] font-display">
              Recently Joined Gyms
            </h2>
            <p className="text-xs mt-0.5 text-[#9CA3AF]">
              Latest 8 gym owners on the platform
            </p>
          </div>
          <a
            href="/admin/gyms"
            className="text-xs font-semibold text-[#F15A24] hover:underline flex items-center gap-1.5"
          >
            View All <i className="fa-solid fa-arrow-right text-[10px]" />
          </a>
        </div>

        {stats?.recentGyms?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8F8F8]">
                  {["Gym Owner", "Plan", "Status", "Expires", "Joined", "Action"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] ${i === 5 ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {stats.recentGyms.map((gym: any) => (
                  <tr
                    key={gym.id}
                    className="hover:bg-[#FFFBF9] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold bg-[#F15A24]"
                        >
                          {gym.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1A1A1A]">{gym.fullName}</p>
                          <p className="text-xs text-[#9CA3AF]">{gym.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#6B6B6B]">
                      {gym.planName ?? <span className="text-gray-300 italic text-xs">None</span>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={gym.status} sub={gym.subscriptionStatus} />
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9CA3AF]">
                      {gym.subscriptionEnd
                        ? new Date(gym.subscriptionEnd).toLocaleDateString("en-ET", { day: "numeric", month: "short", year: "numeric" })
                        : <span className="text-gray-300 italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9CA3AF]">
                      {new Date(gym.createdAt).toLocaleDateString("en-ET", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <GymStatusToggle gymId={gym.id} gymName={gym.fullName} currentStatus={gym.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-building text-2xl text-gray-300" />
            </div>
            <p className="text-sm text-[#9CA3AF]">No gyms have signed up yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
