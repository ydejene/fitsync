import { requireAdminOrStaff } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import { formatETB, formatDate } from "@/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payments" };

async function getPaymentsData() {
  try {
    const result = await apiFetch("/api/payments");
    if (!result.success) return { payments: [], totalRevenue: 0 };
    return result.data;
  } catch (error) {
    console.error("Payments Fetch Error:", error);
    return { payments: [], totalRevenue: 0 };
  }
}

export default async function PaymentsPage() {
  await requireAdminOrStaff();
  const { payments, totalRevenue } = await getPaymentsData();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">
            Total collected: {formatETB(Number(totalRevenue || 0))}
          </p>
        </div>
        <Link 
          href="/payments/new" 
          className="bg-[#F15A24] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#D94E1F] transition-colors flex items-center gap-2"
        >
          <i className="fa-solid fa-plus text-xs" />
          Record Payment
        </Link>
      </div>

      <div className="card overflow-x-auto bg-white border border-[#E5E5E5] rounded-xl shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
              <th className="px-4 py-3 font-semibold text-[#9CA3AF]">Member</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF] hidden md:table-cell">Plan</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF]">Amount</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF] hidden md:table-cell">Method</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF]">Status</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF] hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 font-semibold text-right text-[#9CA3AF]">Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-[#9CA3AF]">
                  <i className="fa-solid fa-money-bill-wave text-2xl block mb-2" />
                  No payments yet
                </td>
              </tr>
            ) : (
              payments.map((payment: any) => (
                <tr key={payment.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1A1A1A]">{payment.full_name}</p>
                    <p className="text-xs text-[#9CA3AF]">{payment.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B] hidden md:table-cell">
                    {payment.plan_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#1A1A1A]">
                    {formatETB(Number(payment.amount_etb))}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[10px] px-2 py-0.5 bg-gray-50 border border-[#E5E5E5] rounded font-bold text-[#6B6B6B] uppercase">
                      {payment.payment_method?.replace("_", " ") ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      payment.status === "COMPLETED" ? "bg-green-50 text-green-600" :
                      payment.status === "PENDING" ? "bg-yellow-50 text-yellow-600" :
                      "bg-red-50 text-red-600"
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B] hidden lg:table-cell">
                    {formatDate(payment.paid_at || payment.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[10px] text-[#9CA3AF] font-mono">
                      {payment.transaction_ref ? payment.transaction_ref.slice(0, 8).toUpperCase() : "—"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}