"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
} from "recharts";
import { formatETB } from "@/utils";

// ── Color palette ──
const COLORS = ["#F15A24", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#6B7280"];
const METHOD_COLORS: Record<string, string> = {
  TELEBIRR: "#F15A24",
  CBE_BIRR: "#16A34A",
  CASH: "#6B7280",
  CARD: "#3B82F6",
};

interface InsightsData {
  kpis: {
    totalMembers: number;
    activeMembers: number;
    monthlyRevenue: number;
    overduePayments: number;
    expiringThisWeek: number;
  };
  demographics: {
    genderDistribution: { gender: string; count: number }[];
    ageGroups: { age_group: string; count: number }[];
  };
  memberships: {
    planPopularity: { plan_name: string; billing_cycle: string; count: number }[];
    activeVsInactive: { active: number; inactive: number };
    batchDistribution: { batch: string; count: number }[];
    feeStatus: { fee_status: string; count: number }[];
  };
  payments: {
    methodBreakdown: { payment_method: string; count: number; total: number }[];
    monthlyRevenue: { month: string; total: number; transactions: number }[];
    revenueByPlan: { plan_name: string; total: number }[];
  };
  attendance: {
    dailyTraffic: { day_label: string; bookings: number; attended: number }[];
    peakHours: { hour: string; count: number }[];
    weeklyTraffic: { day_name: string; count: number }[];
  };
  growth: {
    signups: { month: string; signups: number }[];
    churn: { month: string; churned: number }[];
  };
}

interface AnalyticsData {
  totalRevenue: number;
  totalMembers: number;
  activeMembers: number;
  overdue: number;
  monthlyRevenue: Record<string, number>;
  methodBreakdown: Record<string, number>;
  planBreakdown: { plan_id: string; count: number }[];
}

interface Props {
  data: InsightsData;
  analyticsData?: AnalyticsData | null;
}

// ── Custom tooltip ──
function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Section wrapper ──
function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm ${className}`}>
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ── KPI Card ──
function KpiCard({ label, value, icon, color, subtext }: {
  label: string; value: string; icon: string; color: string; subtext?: string;
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow min-w-0 h-full">
      <div className={`rounded-xl p-2.5 shrink-0 ${color}`}>
        <i className={`fa-solid ${icon} text-base`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight truncate" title={value}>{value}</p>
        {subtext && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{subtext}</p>}
      </div>
    </div>
  );
}

export default function InsightsCharts({ data, analyticsData }: Props) {
  const [dateRange, setDateRange] = useState<"3m" | "6m" | "12m">("12m");
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "members" | "payments" | "attendance" | "growth">("overview");
  const { kpis, demographics, memberships, payments, attendance, growth } = data;

  // Filter monthly revenue by selected range
  const filteredRevenue = useMemo(() => {
    const months = dateRange === "3m" ? 3 : dateRange === "6m" ? 6 : 12;
    return payments.monthlyRevenue.slice(-months);
  }, [payments.monthlyRevenue, dateRange]);

  // Active vs inactive pie data
  const activeInactiveData = [
    { name: "Active", value: memberships.activeVsInactive.active },
    { name: "Inactive", value: memberships.activeVsInactive.inactive },
  ];

  // Fee status pie data
  const feeStatusData = memberships.feeStatus.map((f) => ({
    name: f.fee_status,
    value: f.count,
  }));

  // Growth chart: combine signups and churn
  const growthData = useMemo(() => {
    const monthMap = new Map<string, { month: string; signups: number; churned: number }>();
    growth.signups.forEach((s) => {
      monthMap.set(s.month, { month: s.month, signups: s.signups, churned: 0 });
    });
    growth.churn.forEach((c) => {
      const existing = monthMap.get(c.month);
      if (existing) existing.churned = c.churned;
      else monthMap.set(c.month, { month: c.month, signups: 0, churned: c.churned });
    });
    return Array.from(monthMap.values());
  }, [growth]);

  // Derive analytics values from the optional analyticsData prop
  const totalRevenue = analyticsData?.totalRevenue ?? 0;
  const totalMembers = analyticsData?.totalMembers ?? 0;
  const activeMembers_analytics = analyticsData?.activeMembers ?? 0;
  const overdue = analyticsData?.overdue ?? 0;
  const monthlyRevenue = analyticsData?.monthlyRevenue ?? {};
  const methodBreakdown = analyticsData?.methodBreakdown ?? {};
  const planBreakdown = analyticsData?.planBreakdown ?? [];
 
  const months = Object.keys(monthlyRevenue);
  const monthlyValues = Object.values(monthlyRevenue).map(Number);
  const maxRevenue = monthlyValues.length > 0 ? Math.max(...monthlyValues) : 1;

  const methodColors: Record<string, string> = {
    TELEBIRR: "#F15A24",
    CBE_BIRR: "#16A34A",
    CASH: "#6B7280",
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: "fa-grip" },
    { key: "analytics", label: "Analytics", icon: "fa-gauge-high" },
    { key: "members", label: "Members", icon: "fa-users" },
    { key: "payments", label: "Payments", icon: "fa-money-bill-wave" },
    { key: "attendance", label: "Attendance", icon: "fa-calendar-check" },
    { key: "growth", label: "Growth", icon: "fa-arrow-trend-up" },
  ] as const;

  return (
    <div>
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Total Members"
          value={kpis.totalMembers.toLocaleString()}
          icon="fa-users"
          color="bg-blue-100 text-blue-600"
        />
        <KpiCard
          label="Active Members"
          value={kpis.activeMembers.toLocaleString()}
          icon="fa-user-check"
          color="bg-green-100 text-green-600"
          subtext={`${kpis.totalMembers > 0 ? ((kpis.activeMembers / kpis.totalMembers) * 100).toFixed(1) : 0}% of total`}
        />
        <KpiCard
          label="Monthly Revenue"
          value={formatETB(kpis.monthlyRevenue)}
          icon="fa-coins"
          color="bg-orange-100 text-[#F15A24]"
        />
        <KpiCard
          label="Overdue Payments"
          value={kpis.overduePayments.toLocaleString()}
          icon="fa-circle-exclamation"
          color="bg-red-100 text-red-600"
        />
        <KpiCard
          label="Expiring This Week"
          value={kpis.expiringThisWeek.toLocaleString()}
          icon="fa-clock"
          color="bg-yellow-100 text-yellow-600"
        />
      </div>

      <div className="card p-6 bg-white mb-6 rounded-2xl border border-[#E5E5E5]">
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

      {/* ── Tabs + Date Filter ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-[#F15A24] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className={`fa-solid ${tab.icon} text-xs`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["3m", "6m", "12m"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateRange === range
                  ? "bg-white text-[#F15A24] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {range === "3m" ? "3 Months" : range === "6m" ? "6 Months" : "12 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend */}
            <ChartCard title="Revenue Trend" className="lg:col-span-2">
              {filteredRevenue.length === 0 ? (
                <EmptyState icon="fa-chart-line" text="No revenue data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={filteredRevenue}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F15A24" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#F15A24" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip formatter={(v: any) => formatETB(Number(v))} />} />
                    <Area type="monotone" dataKey="total" stroke="#F15A24" fill="url(#revenueGradient)" strokeWidth={2} name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Active vs Inactive */}
            <ChartCard title="Member Status">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={activeInactiveData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Popularity */}
            <ChartCard title="Popular Membership Plans">
              {memberships.planPopularity.length === 0 ? (
                <EmptyState icon="fa-id-card" text="No membership data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={memberships.planPopularity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <YAxis type="category" dataKey="plan_name" tick={{ fontSize: 11 }} stroke="#9CA3AF" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#F15A24" radius={[0, 6, 6, 0]} name="Members" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Payment Methods */}
            <ChartCard title="Payment Methods">
              {payments.methodBreakdown.length === 0 ? (
                <EmptyState icon="fa-credit-card" text="No payment data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={payments.methodBreakdown.map((m) => ({
                        name: m.payment_method,
                        value: Number(m.total),
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {payments.methodBreakdown.map((m, i) => (
                        <Cell key={i} fill={METHOD_COLORS[m.payment_method] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatETB(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── MEMBERS TAB ── */}
      {activeTab === "members" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gender Distribution */}
            <ChartCard title="Gender Distribution">
              {demographics.genderDistribution.length === 0 ? (
                <EmptyState icon="fa-venus-mars" text="No gender data available" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={demographics.genderDistribution.map((g) => ({
                        name: g.gender,
                        value: g.count,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {demographics.genderDistribution.map((_, i) => (
                        <Cell key={i} fill={["#3B82F6", "#EC4899", "#8B5CF6", "#6B7280"][i % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Age Groups */}
            <ChartCard title="Age Distribution">
              {demographics.ageGroups.length === 0 ? (
                <EmptyState icon="fa-users" text="No date of birth data available" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={demographics.ageGroups}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="age_group" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Members" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Batch Distribution */}
            <ChartCard title="Batch Preference">
              {memberships.batchDistribution.length === 0 ? (
                <EmptyState icon="fa-clock" text="No batch data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={memberships.batchDistribution.map((b) => ({
                        name: b.batch,
                        value: b.count,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {memberships.batchDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fee Status */}
            <ChartCard title="Fee Status Breakdown">
              {feeStatusData.length === 0 ? (
                <EmptyState icon="fa-receipt" text="No fee data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={feeStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#10B981" /> {/* PAID */}
                      <Cell fill="#F59E0B" /> {/* UNPAID */}
                      <Cell fill="#EF4444" /> {/* OVERDUE */}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Plan Popularity Detail */}
            <ChartCard title="Membership Plans">
              {memberships.planPopularity.length === 0 ? (
                <EmptyState icon="fa-id-card" text="No membership data" />
              ) : (
                <div className="space-y-4">
                  {memberships.planPopularity.map((plan, i) => {
                    const total = memberships.planPopularity.reduce((s, p) => s + p.count, 0);
                    const pct = total > 0 ? (plan.count / total) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-gray-700">{plan.plan_name}</span>
                          <span className="text-gray-500">{plan.count} members ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === "analytics" && !analyticsData && (
        <div className="p-10 text-center">
          <h2 className="text-lg font-semibold text-gray-700">Analytics Unavailable</h2>
          <p className="text-sm text-gray-500">Please ensure the backend is running and you have admin permissions.</p>
        </div>
      )}
      {activeTab === "analytics" && analyticsData && (
        <div>
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
      )}

      {/* ── PAYMENTS TAB ── */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <ChartCard title="Monthly Revenue">
            {filteredRevenue.length === 0 ? (
              <EmptyState icon="fa-chart-bar" text="No revenue data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={filteredRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip formatter={(v: any) => formatETB(Number(v))} />} />
                  <Bar dataKey="total" fill="#F15A24" radius={[6, 6, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Plan */}
            <ChartCard title="Revenue by Plan">
              {payments.revenueByPlan.length === 0 ? (
                <EmptyState icon="fa-pie-chart" text="No plan revenue data" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={payments.revenueByPlan}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="total"
                      nameKey="plan_name"
                    >
                      {payments.revenueByPlan.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatETB(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Transaction Volume */}
            <ChartCard title="Transaction Volume">
              {filteredRevenue.length === 0 ? (
                <EmptyState icon="fa-receipt" text="No transaction data" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={filteredRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <Tooltip />
                    <Line type="monotone" dataKey="transactions" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} name="Transactions" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE TAB ── */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {/* Daily Traffic */}
          <ChartCard title="Daily Traffic (Last 30 Days)">
            {attendance.dailyTraffic.length === 0 ? (
              <EmptyState icon="fa-calendar" text="No attendance data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={attendance.dailyTraffic}>
                  <defs>
                    <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="attendedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day_label" tick={{ fontSize: 10 }} stroke="#9CA3AF" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <Tooltip />
                  <Area type="monotone" dataKey="bookings" stroke="#3B82F6" fill="url(#bookingsGradient)" strokeWidth={2} name="Bookings" />
                  <Area type="monotone" dataKey="attended" stroke="#10B981" fill="url(#attendedGradient)" strokeWidth={2} name="Attended" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <ChartCard title="Peak Hours">
              {attendance.peakHours.length === 0 ? (
                <EmptyState icon="fa-clock" text="No hourly data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={attendance.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Weekly Traffic */}
            <ChartCard title="Busiest Days of the Week">
              {attendance.weeklyTraffic.length === 0 ? (
                <EmptyState icon="fa-calendar-week" text="No weekly data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={attendance.weeklyTraffic}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day_name" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── GROWTH TAB ── */}
      {activeTab === "growth" && (
        <div className="space-y-6">
          {/* Sign-ups Over Time */}
          <ChartCard title="New Sign-ups Over Time">
            {growth.signups.length === 0 ? (
              <EmptyState icon="fa-user-plus" text="No sign-up data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={growth.signups}>
                  <defs>
                    <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <Tooltip />
                  <Area type="monotone" dataKey="signups" stroke="#10B981" fill="url(#signupGradient)" strokeWidth={2} name="New Members" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Growth vs Churn */}
          <ChartCard title="Sign-ups vs Churn">
            {growthData.length === 0 ? (
              <EmptyState icon="fa-arrow-trend-up" text="No growth data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="signups" fill="#10B981" radius={[4, 4, 0, 0]} name="Sign-ups" />
                  <Bar dataKey="churned" fill="#EF4444" radius={[4, 4, 0, 0]} name="Churned" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}

// ── Empty state ──
function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
      <i className={`fa-solid ${icon} text-3xl mb-2`} />
      <p className="text-sm">{text}</p>
    </div>
  );
}
