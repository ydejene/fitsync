import { requireAdminOrStaff } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import { formatDate, getDaysUntilExpiry } from "@/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Memberships" };

async function getMemberships() {
  try {
    const result = await apiFetch("/api/memberships");
    if (!result.success) return [];
    return result.data?.memberships || [];
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}

export default async function MembershipsPage() {
  await requireAdminOrStaff();
  const memberships = await getMemberships();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Memberships</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">{memberships.length} enrollments</p>
        </div>
        <Link href="/memberships/new" className="bg-[#F15A24] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#D94E1F] transition-colors flex items-center gap-2">
          <i className="fa-solid fa-plus text-xs" />
          New Membership
        </Link>
      </div>

      <div className="card overflow-hidden bg-white border border-[#E5E5E5] rounded-xl shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
              <th className="px-4 py-3 font-semibold text-[#9CA3AF]">Member</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF] hidden md:table-cell">Plan</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF] hidden md:table-cell">Batch</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF]">Expires</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF]">Payment</th>
              <th className="px-4 py-3 font-semibold text-right text-[#9CA3AF]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {memberships.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-[#9CA3AF]">
                  <i className="fa-solid fa-id-card text-2xl block mb-2" />
                  No memberships yet
                </td>
              </tr>
            ) : (
              memberships.map((m: any) => {
                const daysLeft = getDaysUntilExpiry(m.end_date);
                const expiredBadge =
                  daysLeft < 0
                    ? "bg-red-50 text-red-600"
                    : daysLeft <= 7
                    ? "bg-orange-50 text-orange-600"
                    : "bg-green-50 text-green-600";
                
                const expiryLabel =
                  daysLeft < 0
                    ? `Expired ${Math.abs(daysLeft)}d ago`
                    : daysLeft === 0
                    ? "Expires today"
                    : `${daysLeft}d left`;

                return (
                  <tr key={m.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1A1A1A]">{m.full_name}</p>
                      <p className="text-xs text-[#9CA3AF]">{m.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-medium text-[#1A1A1A]">{m.plan_name}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[#6B6B6B]">
                      {m.batch === "MORNING" ? "Morning" : "Evening"}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-[#1A1A1A]">{formatDate(m.end_date)}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mt-1 inline-block ${expiredBadge}`}>
                          {expiryLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        m.fee_status === "PAID" ? "bg-green-50 text-green-600" :
                        m.fee_status === "OVERDUE" ? "bg-red-50 text-red-600" :
                        "bg-yellow-50 text-yellow-600"
                      }`}>
                        {m.fee_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/memberships/${m.id}`}
                        className="text-xs font-medium text-[#F15A24] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}