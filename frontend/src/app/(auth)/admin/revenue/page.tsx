// src/app/(auth)/admin/revenue/page.tsx
// Platform subscription revenue breakdown — Light Theme

import { requireAdmin } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Platform Revenue | Admin Console" };

function formatETB(n: number) {
  return `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function RevenuePage() {
  await requireAdmin();

  const [statsRes, chartRes] = await Promise.all([
    apiFetch("/api/admin/stats"),
    apiFetch("/api/admin/revenue-chart"),
  ]);

  const stats = statsRes.success ? statsRes.data : null;
  const chart: { month: string; revenue: number }[] = chartRes.success ? chartRes.data.chart : [];
  const maxRevenue = chart.length ? Math.max(...chart.map((c) => c.revenue), 1) : 1;

  const cards = stats
    ? [
        {
          label: "All-Time Revenue",
          value: formatETB(stats.revenueAllTime),
          icon: "fa-vault",
          color: "text-[#F15A24] bg-[#FFF0EB] border-[#F15A24]/10",
        },
        {
          label: "This Month",
          value: formatETB(stats.revenueThisMonth),
          icon: "fa-calendar-check",
          color: "text-green-600 bg-green-50 border-green-200/50",
          sub: stats.revenueChange >= 0 ? `+${stats.revenueChange}% vs last month` : `${stats.revenueChange}% vs last month`,
          subColor: stats.revenueChange >= 0 ? "text-green-600" : "text-red-500",
        },
        {
          label: "Last Month",
          value: formatETB(stats.revenueLastMonth),
          icon: "fa-clock-rotate-left",
          color: "text-blue-600 bg-blue-50 border-blue-200/50",
        },
      ]
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight font-display">
          Platform Revenue
        </h1>
        <p className="text-sm text-[#6B6B6B] mt-1">Subscription income from all gyms on FitSync</p>
      </div>

      {/* Summary cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {cards.map((card) => (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl bg-white border border-[#E5E5E5] p-6 shadow-sm"
            >
              <div className="flex items-start justify-between relative">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">{card.label}</p>
                  <p className="text-2xl font-bold text-[#1A1A1A] tracking-tight font-display leading-none">{card.value}</p>
                  {card.sub && (
                    <p className={`text-xs mt-2 font-medium ${card.subColor}`}>{card.sub}</p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${card.color}`}>
                  <i className={`fa-solid ${card.icon} text-sm`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bar chart */}
      <div className="rounded-2xl bg-white border border-[#E5E5E5] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#F0F0F0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1A1A1A] font-display">Monthly Subscription Revenue</h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Rolling 12-month earnings trend</p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#9CA3AF]">
              <span className="w-2 h-2 rounded-full bg-[#F15A24]" />
              Revenue (ETB)
            </span>
          </div>
        </div>

        {chart.length > 0 ? (
          <div className="p-8">
            <div className="flex items-end gap-3 h-56 px-2">
              {chart.map((point) => {
                const heightPct = (point.revenue / maxRevenue) * 100;
                return (
                  <div
                    key={point.month}
                    className="flex-1 flex flex-col items-center gap-2 group relative"
                    title={`${point.month}: ${formatETB(point.revenue)}`}
                  >
                    <div className="relative w-full flex flex-col justify-end h-52">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 scale-95 group-hover:scale-100">
                        <div className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                          {formatETB(point.revenue)}
                        </div>
                        <div className="w-2 h-2 bg-[#1A1A1A] rotate-45 mx-auto -mt-1 shadow-xl" />
                      </div>
                      
                      {/* Bar */}
                      <div
                        className="w-full rounded-t-lg bg-[#F15A24] transition-all duration-500 hover:brightness-110 min-h-[4px] shadow-sm"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-medium text-[#9CA3AF] text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                      {point.month.split(" ")[0]}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Y-axis baseline */}
            <div className="h-px bg-[#F0F0F0] w-full" />
            
            <div className="flex justify-between text-[10px] font-semibold text-[#CED4DA] mt-3">
              <span>ETB 0</span>
              <span>Total Platform Reach</span>
              <span>{formatETB(maxRevenue)}</span>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-chart-simple text-2xl text-gray-300" />
            </div>
            <p className="text-[#9CA3AF] text-sm">No subscription revenue recorded yet</p>
            <p className="text-gray-300 text-xs mt-1 italic">Earnings will appear once gyms pay via Telebirr</p>
          </div>
        )}
      </div>
    </div>
  );
}
