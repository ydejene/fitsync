import { requireAdminOrStaff } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import { formatDate, formatETB } from "@/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getMemberDetails(id: string) {
  const result = await apiFetch(`/api/members/${id}`);
  if (!result.success) return null;
  return result.data;
}

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminOrStaff();
  const { id } = await params;
  const data = await getMemberDetails(id);

  if (!data) return notFound();

  const { member } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/members" className="text-sm text-[#6B6B6B] hover:text-[#F15A24] transition-colors">
          <i className="fa-solid fa-arrow-left mr-2" /> Back to Members
        </Link>
        <div className="flex gap-3">
          <Link href={`/members/${id}/edit`} className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-sm font-medium bg-white hover:bg-gray-50">
            Edit Profile
          </Link>
          <button className="px-4 py-2 bg-[#F15A24] text-white rounded-lg text-sm font-medium hover:bg-[#D94E1F]">
            Renew Membership
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] text-center shadow-sm">
            <div className="w-20 h-20 bg-[#F15A24] rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4">
              {member.full_name?.substring(0, 2).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">{member.full_name}</h2>
            <p className="text-sm text-[#6B6B6B]">{member.email}</p>
            <div className="mt-4 flex justify-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {member.status}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
            <h3 className="text-xs font-bold uppercase text-[#9CA3AF] mb-4">Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Phone</span>
                <span className="font-medium">{member.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Address</span>
                <span className="font-medium">{member.address || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Joined</span>
                <span className="font-medium">{formatDate(member.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Membership History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Membership History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[#9CA3AF] border-b border-[#F0F0F0]">
                    <th className="pb-3 font-semibold">Plan</th>
                    <th className="pb-3 font-semibold">Start Date</th>
                    <th className="pb-3 font-semibold">End Date</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {member.memberships?.map((m: any) => (
                    <tr key={m.id}>
                      <td className="py-4 font-medium">{m.plan_name}</td>
                      <td className="py-4">{formatDate(m.start_date)}</td>
                      <td className="py-4">{formatDate(m.end_date)}</td>
                      <td className="py-4 text-right">
                        <span className={`text-xs font-bold ${m.fee_status === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>
                          {m.fee_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!member.memberships || member.memberships.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#9CA3AF]">No membership records.</td>
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