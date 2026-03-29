import { requireAdminOrStaff } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import { formatDate, getDaysUntilExpiry } from "@/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

interface MembershipPayment {
  id: string;
  amount_etb: number;
  payment_method: string | null;
  transaction_ref: string | null;
  status: string;
  notes: string | null;
  paid_at: string;
}

interface MembershipHistory {
  id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  fee_status: string;
  batch: string;
}

async function getMembershipDetail(id: string) {
  const result = await apiFetch(`/api/memberships/${id}`);
  if (!result.success) return null;
  return result.data;
}

export default async function MembershipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminOrStaff();
  const { id } = await params;
  const data = await getMembershipDetail(id);

  if (!data) return notFound();

  const { membership: m, payments, history } = data;

  const daysLeft = getDaysUntilExpiry(m.end_date);
  const isExpired = daysLeft < 0;
  const isExpiringSoon = daysLeft >= 0 && daysLeft <= 7;

  const statusBadge = isExpired
    ? "bg-red-50 text-red-600"
    : isExpiringSoon
    ? "bg-orange-50 text-orange-600"
    : "bg-green-50 text-green-600";

  const statusLabel = isExpired
    ? `Expired ${Math.abs(daysLeft)}d ago`
    : daysLeft === 0
    ? "Expires today"
    : `${daysLeft}d left`;

  const feeBadge =
    m.fee_status === "PAID"
      ? "bg-green-50 text-green-600"
      : m.fee_status === "OVERDUE"
      ? "bg-red-50 text-red-600"
      : "bg-yellow-50 text-yellow-600";

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/memberships"
          className="text-sm text-[#6B6B6B] hover:text-[#F15A24] transition-colors"
        >
          <i className="fa-solid fa-arrow-left mr-2" /> Back to Memberships
        </Link>
        <div className="flex gap-3">
          <Link
            href={`/members/${m.user_id}`}
            className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-sm font-medium bg-white hover:bg-gray-50 transition-colors"
          >
            View Member
          </Link>
          {m.fee_status !== "PAID" && (
            <Link
              href={`/memberships/${id}/payments/new`}
              className="px-4 py-2 bg-[#F15A24] text-white rounded-lg text-sm font-medium hover:bg-[#D94E1F] transition-colors"
            >
              Record Payment
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Member + Membership info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Member card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm text-center">
            <div className="w-16 h-16 bg-[#F15A24] rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold mb-3">
              {m.full_name?.substring(0, 2).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">{m.full_name}</h2>
            <p className="text-sm text-[#6B6B6B]">{m.email}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  m.member_status === "ACTIVE"
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {m.member_status}
              </span>
            </div>
          </div>

          {/* Membership details card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
            <h3 className="text-xs font-bold uppercase text-[#9CA3AF] mb-4">
              Membership Details
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#6B6B6B]">Plan</span>
                <span className="font-semibold text-[#1A1A1A]">{m.plan_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B6B6B]">Price</span>
                <span className="font-semibold text-[#F15A24]">
                  {Number(m.price_etb).toLocaleString()} ETB
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B6B6B]">Billing</span>
                <span className="font-medium capitalize">
                  {m.billing_cycle?.toLowerCase().replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B6B6B]">Duration</span>
                <span className="font-medium">{m.duration_days} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B6B6B]">Batch</span>
                <span className="font-medium capitalize">
                  {m.batch?.charAt(0) + m.batch?.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="border-t border-[#F0F0F0] pt-4 flex justify-between items-center">
                <span className="text-[#6B6B6B]">Start</span>
                <span className="font-medium">{formatDate(m.start_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B6B6B]">End</span>
                <span className="font-medium">{formatDate(m.end_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B6B6B]">Status</span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusBadge}`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B6B6B]">Payment</span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${feeBadge}`}
                >
                  {m.fee_status}
                </span>
              </div>
            </div>
          </div>

          {/* Plan features */}
          {m.plan_features && m.plan_features.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
              <h3 className="text-xs font-bold uppercase text-[#9CA3AF] mb-4">
                Plan Features
              </h3>
              <ul className="space-y-2">
                {m.plan_features.map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                    <span className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <svg
                        className="w-3 h-3 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT — Payments + History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payments */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1A1A1A]">Payments</h3>
              {m.fee_status !== "PAID" && (
                <Link
                  href={`/memberships/${id}/payments/new`}
                  className="text-xs font-medium text-[#F15A24] hover:underline"
                >
                  + Record Payment
                </Link>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[#9CA3AF] border-b border-[#F0F0F0]">
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold hidden sm:table-cell">Method</th>
                    <th className="pb-3 font-semibold hidden md:table-cell">Reference</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {payments && payments.length > 0 ? (
                    payments.map((p: MembershipPayment) => (
                      <tr key={p.id}>
                        <td className="py-4 text-[#1A1A1A]">{formatDate(p.paid_at)}</td>
                        <td className="py-4 font-semibold text-[#1A1A1A]">
                          {Number(p.amount_etb).toLocaleString()} ETB
                        </td>
                        <td className="py-4 hidden sm:table-cell text-[#6B6B6B] capitalize">
                          {p.payment_method
                            ?.toLowerCase()
                            .replace("_", " ") || "—"}
                        </td>
                        <td className="py-4 hidden md:table-cell text-[#6B6B6B] font-mono text-xs">
                          {p.transaction_ref || "—"}
                        </td>
                        <td className="py-4 text-right">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              p.status === "COMPLETED"
                                ? "bg-green-50 text-green-600"
                                : p.status === "FAILED"
                                ? "bg-red-50 text-red-600"
                                : "bg-yellow-50 text-yellow-600"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#9CA3AF]">
                        No payments recorded for this membership.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Other memberships for this member */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">
              Other Memberships
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[#9CA3AF] border-b border-[#F0F0F0]">
                    <th className="pb-3 font-semibold">Plan</th>
                    <th className="pb-3 font-semibold">Start</th>
                    <th className="pb-3 font-semibold">End</th>
                    <th className="pb-3 font-semibold hidden sm:table-cell">Batch</th>
                    <th className="pb-3 font-semibold text-right">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {history && history.length > 0 ? (
                    history.map((h: MembershipHistory) => (
                      <tr key={h.id} className="hover:bg-[#F9FAFB]">
                        <td className="py-4">
                          <Link
                            href={`/memberships/${h.id}`}
                            className="font-medium text-[#1A1A1A] hover:text-[#F15A24] transition-colors"
                          >
                            {h.plan_name}
                          </Link>
                        </td>
                        <td className="py-4 text-[#6B6B6B]">
                          {formatDate(h.start_date)}
                        </td>
                        <td className="py-4 text-[#6B6B6B]">
                          {formatDate(h.end_date)}
                        </td>
                        <td className="py-4 hidden sm:table-cell text-[#6B6B6B] capitalize">
                          {h.batch?.charAt(0) + h.batch?.slice(1).toLowerCase()}
                        </td>
                        <td className="py-4 text-right">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              h.fee_status === "PAID"
                                ? "bg-green-50 text-green-600"
                                : h.fee_status === "OVERDUE"
                                ? "bg-red-50 text-red-600"
                                : "bg-yellow-50 text-yellow-600"
                            }`}
                          >
                            {h.fee_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#9CA3AF]">
                        No other memberships for this member.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
