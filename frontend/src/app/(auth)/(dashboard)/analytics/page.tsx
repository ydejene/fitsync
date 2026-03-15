import { requireAdminOrStaff } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import { formatETB } from "@/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

async function getAnalyticsData() {
  try {
    const result = await apiFetch("/api/analytics");
    if (!result.success) throw new Error(result.message || "Failed to fetch analytics");
    return result.data;
  } catch (error) {
    console.error("Analytics Fetch Error:", error);
    return null;
  }
}

export default async function AnalyticsPage() {
  await requireAdminOrStaff();
  const data = await getAnalyticsData();

  if (!data) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-lg font-semibold text-gray-700">Analytics Unavailable</h2>
        <p className="text-sm text-gray-500">Please ensure the backend is running and you have admin permissions.</p>
      </div>
    );
  }

  const {
    totalRevenue,
    totalMembers,
    activeMembers,
    overdue,
    monthlyRevenue,
    methodBreakdown,
    planBreakdown,
  } = data;

  const months = Object.keys(monthlyRevenue || {});
  // Safety fix: ensure we don't pass an empty array to Math.max
  const monthlyValues = Object.values(monthlyRevenue || {}).map(Number);
  const maxRevenue = monthlyValues.length > 0 ? Math.max(...monthlyValues) : 1;

  const methodColors: Record<string, string> = {
    TELEBIRR: "#F15A24",
    CBE_BIRR: "#16A34A",
    CASH: "#6B7280",
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Financial and membership insights</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Revenue (6mo)", value: formatETB(totalRevenue || 0), icon: "fa-coins", color: "bg-orange-100 text-[#F15A24]" },
          { label: "Total Members", value: (totalMembers || 0).toString(), icon: "fa-users", color: "bg-blue-100 text-blue-600" },
          { label: "Active Members", value: (activeMembers || 0).toString(), icon: "fa-user-check", color: "bg-green-100 text-green-600" },
          { label: "Overdue Payments", value: (overdue || 0).toString(), icon: "fa-circle-exclamation", color: "bg-red-100 text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-[#E5E5E5] flex items-center gap-4 shadow-sm">
            <div className={`rounded-xl p-3 ${stat.color}`}>
              <i className={`fa-solid ${stat.icon} text-lg`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] lg:col-span-2 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Monthly Revenue (Last 6 Months)</h2>
          {months.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <i className="fa-solid fa-chart-bar text-3xl mb-2" />
              <p className="text-sm">No payment data yet</p>
            </div>
          ) : (
            <div className="flex items-end gap-4 h-48">
              {months.map((month) => {
                const val = Number(monthlyRevenue[month] || 0);
                const heightPct = (val / maxRevenue) * 100;
                return (
                  <div key={month} className="flex flex-col items-center gap-2 flex-1">
                    <p className="text-[10px] font-semibold text-gray-700">{formatETB(val)}</p>
                    <div className="w-full bg-gray-100 rounded-t-lg relative overflow-hidden h-32">
                      <div
                        className="absolute bottom-0 w-full bg-[#F15A24] rounded-t-lg transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500">{month}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Payment Methods</h2>
          {Object.keys(methodBreakdown || {}).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <i className="fa-solid fa-credit-card text-3xl mb-2" />
              <p className="text-sm">No data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(methodBreakdown || {}).map(([method, amount]: [string, any]) => {
                const pct = totalRevenue > 0 ? (Number(amount) / totalRevenue) * 100 : 0;
                return (
                  <div key={method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{method}</span>
                      <span className="text-gray-500">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: methodColors[method] ?? "#6B7280",
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatETB(Number(amount))}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] lg:col-span-3 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Membership Plan Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {planBreakdown?.map((pb: any) => (
              <div key={pb.plan_id} className="rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-3xl font-bold text-[#F15A24]">{pb.count}</p>
                <p className="text-sm text-gray-600 mt-1">Plan ID: {pb.plan_id}</p>
                <p className="text-xs text-gray-400 mt-0.5">members</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}