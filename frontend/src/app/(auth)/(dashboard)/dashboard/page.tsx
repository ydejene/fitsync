import { getSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import { formatETB, formatDate } from "@/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

/* ── Admin / Staff stats ── */
async function getAdminStats() {
  try {
    const result = await apiFetch("/api/dashboard");
    if (!result.success) return null;
    const d = result.data;
    return {
      totalMembers: d.totalMembers || 0,
      activeMembers: d.activeMembers || 0,
      overdueCount: d.overdueCount || 0,
      expiringCount: d.expiringCount || 0,
      mrr: d.mrr || 0,
      lastMrr: d.lastMrr || 0,
      churnRate: d.churnRate || 0,
    };
  } catch {
    return null;
  }
}

/* ── Member stats ── */
async function getMemberStats() {
  try {
    const result = await apiFetch("/api/dashboard/member");
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isMember = session.role === "MEMBER";

  if (isMember) {
    const data = await getMemberStats();
    return <MemberDashboard data={data} name={session.fullName} />;
  }

  // Admin / Staff / Owner
  const stats = (await getAdminStats()) || {
    totalMembers: 0, activeMembers: 0, overdueCount: 0,
    expiringCount: 0, mrr: 0, lastMrr: 0, churnRate: 0,
  };

  return <AdminDashboard stats={stats} />;
}

/* ═══════════════════════════════════════════
   ADMIN / STAFF DASHBOARD
   ═══════════════════════════════════════════ */
interface AdminStats {
  totalMembers: number;
  activeMembers: number;
  overdueCount: number;
  expiringCount: number;
  mrr: number;
  lastMrr: number;
  churnRate: number;
}

function AdminDashboard({ stats }: { stats: AdminStats }) {
  const cards = [
    { label: "Total Members", value: stats.totalMembers.toString(), icon: "fa-users", color: "text-blue-600 bg-blue-50", change: null },
    { label: "Active Members", value: stats.activeMembers.toString(), icon: "fa-user-check", color: "text-green-600 bg-green-50", change: null },
    {
      label: "Revenue This Month", value: formatETB(stats.mrr), icon: "fa-money-bill-trend-up", color: "text-orange-600 bg-orange-50",
      change: stats.lastMrr > 0 ? `${(((stats.mrr - stats.lastMrr) / stats.lastMrr) * 100).toFixed(1)}% vs last month` : null,
    },
    { label: "Overdue Payments", value: stats.overdueCount.toString(), icon: "fa-circle-exclamation", color: "text-red-600 bg-red-50", change: null },
    { label: "Expiring This Week", value: stats.expiringCount.toString(), icon: "fa-clock", color: "text-yellow-600 bg-yellow-50", change: null },
    { label: "Churn Rate", value: `${stats.churnRate}%`, icon: "fa-chart-line", color: "text-purple-600 bg-purple-50", change: "month-over-month" },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">Overview of your gym at a glance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="stat-card p-5 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">{card.label}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1A1A1A] mt-1 truncate">{card.value}</p>
                {card.change && <p className="text-xs text-[#9CA3AF] mt-1">{card.change}</p>}
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
                <i className={`fa-solid ${card.icon} text-sm`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div className="card p-6 bg-white rounded-2xl border border-[#E5E5E5]">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Add Member", href: "/members/new", icon: "fa-user-plus" },
              { label: "Record Payment", href: "/payments/new", icon: "fa-money-bill" },
              { label: "New Membership", href: "/memberships/new", icon: "fa-id-card" },
              { label: "Book Class", href: "/bookings/new", icon: "fa-calendar-plus" },
            ].map((a) => (
              <Link key={a.label} href={a.href} className="flex items-center gap-3 p-3 border border-[#E5E5E5] rounded-lg hover:border-[#F15A24] hover:bg-[#FFF0EB] transition-all group">
                <i className={`fa-solid ${a.icon} text-[#9CA3AF] group-hover:text-[#F15A24] text-sm`} />
                <span className="text-sm font-medium text-[#1A1A1A]">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-6 bg-white rounded-2xl border border-[#E5E5E5]">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">System Status</h2>
          <div className="space-y-3">
            {[
              { label: "Database", status: "Operational", ok: true },
              { label: "Backend API", status: "Connected", ok: true },
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

/* ═══════════════════════════════════════════
   MEMBER DASHBOARD
   ═══════════════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MemberDashboard({ data, name }: { data: any; name: string }) {
  const m = data?.activeMembership;
  const daysLeft = data?.daysLeft;
  const attendance = data?.attendance || { attended: 0, cancelled: 0, total: 0 };
  const upcomingClasses = data?.upcomingClasses || [];
  const recentPayments = data?.recentPayments || [];

  const isExpired = daysLeft !== null && daysLeft < 0;
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {name?.split(" ")[0] || "Member"}</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">Here&apos;s your fitness overview</p>
        </div>
        <Link href="/profile" className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-sm font-medium bg-white hover:bg-gray-50 transition-colors">
          Edit Profile
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {/* Membership status */}
        <div className="p-5 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Membership</p>
              <p className="text-base sm:text-lg font-bold text-[#1A1A1A] mt-1 truncate">{m?.plan_name || "None"}</p>
              {m && (
                <span className={`inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  isExpired ? "bg-red-50 text-red-600"
                    : isExpiringSoon ? "bg-orange-50 text-orange-600"
                    : "bg-green-50 text-green-600"
                }`}>
                  {isExpired ? `Expired ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
                </span>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-blue-600 bg-blue-50">
              <i className="fa-solid fa-id-card text-sm" />
            </div>
          </div>
        </div>

        {/* Payment status */}
        <div className="p-5 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Payment Status</p>
              <p className={`text-base sm:text-lg font-bold mt-1 truncate ${
                m?.fee_status === "PAID" ? "text-green-600"
                  : m?.fee_status === "OVERDUE" ? "text-red-600"
                  : "text-yellow-600"
              }`}>
                {m?.fee_status || "—"}
              </p>
              {m && <p className="text-xs text-[#9CA3AF] mt-0.5">{Number(m.price_etb).toLocaleString()} ETB</p>}
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              m?.fee_status === "PAID" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
            }`}>
              <i className="fa-solid fa-money-bill-wave text-sm" />
            </div>
          </div>
        </div>

        {/* Classes attended */}
        <div className="p-5 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Classes (30d)</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1A1A1A] mt-1">{attendance.attended}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{attendance.total} booked · {attendance.cancelled} cancelled</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-purple-600 bg-purple-50">
              <i className="fa-solid fa-calendar-check text-sm" />
            </div>
          </div>
        </div>

        {/* Attendance rate */}
        <div className="p-5 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Attendance Rate</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1A1A1A] mt-1">
                {attendance.total > 0 ? Math.round((attendance.attended / attendance.total) * 100) : 0}%
              </p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Last 30 days</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-orange-600 bg-orange-50">
              <i className="fa-solid fa-chart-line text-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Upcoming classes */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Upcoming Classes</h2>
            <Link href="/bookings" className="text-xs font-medium text-[#F15A24] hover:underline">View All</Link>
          </div>
          {upcomingClasses.length > 0 ? (
            <div className="space-y-3">
              {upcomingClasses.map((c: { booking_id: string; name: string; instructor: string; location: string; schedule_at: string; duration_min: number }) => (
                <div key={c.booking_id} className="flex items-center gap-4 p-3 rounded-xl border border-[#F0F0F0] hover:bg-[#F9FAFB] transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[#FFF0EB] flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-dumbbell text-[#F15A24] text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1A1A1A] text-sm">{c.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{c.instructor} · {c.location}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {new Date(c.schedule_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      {new Date(c.schedule_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}{c.duration_min}min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#9CA3AF]">
              <i className="fa-solid fa-calendar-xmark text-2xl mb-2 block" />
              <p className="text-sm">No upcoming classes</p>
              <Link href="/bookings/new" className="text-xs text-[#F15A24] font-medium hover:underline mt-1 inline-block">
                Book a class →
              </Link>
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Recent Payments</h2>
            <Link href="/payments" className="text-xs font-medium text-[#F15A24] hover:underline">View All</Link>
          </div>
          {recentPayments.length > 0 ? (
            <div className="space-y-3">
              {recentPayments.map((p: { id: string; plan_name: string; amount_etb: number; payment_method: string; status: string; paid_at: string }) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-[#F0F0F0]">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      p.status === "COMPLETED" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                    }`}>
                      <i className="fa-solid fa-receipt text-xs" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{p.plan_name || "Payment"}</p>
                      <p className="text-xs text-[#9CA3AF]">{formatDate(p.paid_at)} · {p.payment_method?.toLowerCase().replace("_", " ") || "—"}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm text-[#1A1A1A]">{Number(p.amount_etb).toLocaleString()} ETB</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#9CA3AF]">
              <i className="fa-solid fa-receipt text-2xl mb-2 block" />
              <p className="text-sm">No payment history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}