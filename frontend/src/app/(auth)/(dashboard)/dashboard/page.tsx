import { requireAdminOrStaff } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import { formatETB } from "@/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function getStats() {
  try {
    const result = await apiFetch("/api/dashboard");

    if (!result.success) throw new Error(result.message || "Failed to fetch");

    const data = result.data;

    return {
      totalMembers: data.totalMembers || 0,
      activeMembers: data.activeMembers || 0,
      overdueCount: data.overdueCount || 0,
      expiringCount: data.expiringCount || 0,
      mrr: data.mrr || 0,
      lastMrr: data.lastMrr || 0,
      churnRate: data.churnRate || 0,
    };
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      overdueCount: 0,
      expiringCount: 0,
      mrr: 0,
      lastMrr: 0,
      churnRate: 0,
    };
  }
}

export default async function DashboardPage() {
  await requireAdminOrStaff();
  const stats = await getStats();
  const cards = [
    {
      label: "Total Members",
      value: stats.totalMembers.toString(),
      icon: "fa-users",
      color: "text-blue-600 bg-blue-50",
      change: null,
    },
    {
      label: "Active Members",
      value: stats.activeMembers.toString(),
      icon: "fa-user-check",
      color: "text-green-600 bg-green-50",
      change: null,
    },
    {
      label: "Revenue This Month",
      value: formatETB(stats.mrr),
      icon: "fa-money-bill-trend-up",
      color: "text-orange-600 bg-orange-50",
      change: stats.lastMrr > 0
        ? `${((stats.mrr - stats.lastMrr) / stats.lastMrr * 100).toFixed(1)}% vs last month`
        : null,
    },
    {
      label: "Overdue Payments",
      value: stats.overdueCount.toString(),
      icon: "fa-circle-exclamation",
      color: "text-red-600 bg-red-50",
      change: null,
    },
    {
      label: "Expiring This Week",
      value: stats.expiringCount.toString(),
      icon: "fa-clock",
      color: "text-yellow-600 bg-yellow-50",
      change: null,
    },
    {
      label: "Churn Rate",
      value: `${stats.churnRate}%`,
      icon: "fa-chart-line",
      color: "text-purple-600 bg-purple-50",
      change: "month-over-month",
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">Overview of your gym at a glance</p>
          <p className="text-xs text-[#9CA3AF]">የጂምዎ አጠቃላይ እይታ</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="stat-card p-5 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">{card.label}</p>
                <p className="font-[family-name:var(--font-barlow)] text-3xl font-bold text-[#1A1A1A] mt-1">
                  {card.value}
                </p>
                {card.change && (
                  <p className="text-xs text-[#9CA3AF] mt-1">{card.change}</p>
                )}
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <i className={`fa-solid ${card.icon} text-sm`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick action cards */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-6 bg-white rounded-2xl border border-[#E5E5E5]">
          <h2 className="font-[family-name:var(--font-barlow)] text-lg font-semibold text-[#1A1A1A] mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Add Member", href: "/members/new", icon: "fa-user-plus" },
              { label: "Record Payment", href: "/payments/new", icon: "fa-money-bill" },
              { label: "New Membership", href: "/memberships/new", icon: "fa-id-card" },
              { label: "Book Class", href: "/bookings/new", icon: "fa-calendar-plus" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-3 border border-[#E5E5E5] rounded-lg hover:border-[#F15A24] hover:bg-[#FFF0EB] transition-all group"
              >
                <i className={`fa-solid ${action.icon} text-[#9CA3AF] group-hover:text-[#F15A24] text-sm`} />
                <span className="text-sm font-medium text-[#1A1A1A]">{action.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="card p-6 bg-white rounded-2xl border border-[#E5E5E5]">
          <h2 className="font-[family-name:var(--font-barlow)] text-lg font-semibold text-[#1A1A1A] mb-4">
            System Status
          </h2>
          <div className="space-y-3">
            {[
              { label: "Database", status: "Operational", ok: true },
              { label: "Backend API", status: "Connected", ok: !!stats },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#F0F0F0] last:border-0">
                <span className="text-sm text-[#1A1A1A]">{item.label}</span>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${item.ok ? "text-green-600" : "text-red-600"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? "bg-green-500" : "bg-red-500"}`} />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}