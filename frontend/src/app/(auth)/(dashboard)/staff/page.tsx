import { requireAdmin } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import { formatDate } from "@/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Staff Management" };

async function getStaffMembers() {
  try {
    const result = await apiFetch("/api/staff");
    if (!result.success) return [];
    return result.data?.staff || [];
  } catch (error) {
    console.error("Staff Fetch Error:", error);
    return [];
  }
}

export default async function StaffPage() {
  // strictly Admin only
  await requireAdmin();
  const staffMembers = await getStaffMembers();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">{staffMembers.length} staff members</p>
        </div>
        <Link 
          href="/staff/new" 
          className="bg-[#F15A24] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#D94E1F] transition-colors flex items-center gap-2"
        >
          <i className="fa-solid fa-user-plus text-xs" />
          Add Staff
        </Link>
      </div>

      {/* Permissions info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6">
        <i className="fa-solid fa-circle-info text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-900">Staff Permission System</p>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            Staff have limited access by default. As admin, you can grant or revoke permissions per staff member.
            Staff cannot access Analytics, Audit Log, or Staff Management.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden bg-white border border-[#E5E5E5] rounded-xl shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
              <th className="px-5 py-3 font-semibold text-[#9CA3AF]">Staff Member</th>
              <th className="px-5 py-3 font-semibold text-[#9CA3AF] hidden md:table-cell">Phone</th>
              <th className="px-5 py-3 font-semibold text-[#9CA3AF]">Status</th>
              <th className="px-5 py-3 font-semibold text-[#9CA3AF] hidden lg:table-cell">Added</th>
              <th className="px-5 py-3 font-semibold text-right text-[#9CA3AF]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {staffMembers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-[#9CA3AF]">
                  <i className="fa-solid fa-user-tie text-2xl block mb-2" />
                  No staff added yet
                </td>
              </tr>
            ) : (
              staffMembers.map((staff: any) => (
                <tr key={staff.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">
                          {(staff.full_name || "S M").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1A1A]">{staff.full_name}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#6B6B6B] hidden md:table-cell">
                    {staff.phone ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      staff.status === "ACTIVE" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    }`}>
                      {staff.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#6B6B6B] hidden lg:table-cell text-xs">
                    {formatDate(staff.created_at)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/staff/${staff.id}/permissions`}
                        className="text-[11px] px-3 py-1.5 border border-[#E5E5E5] rounded-lg font-bold text-[#1A1A1A] hover:bg-[#F8F8F8] transition-all flex items-center gap-2"
                      >
                        <i className="fa-solid fa-key text-[#9CA3AF]" />
                        Permissions
                      </Link>
                      <Link
                        href={`/staff/${staff.id}`}
                        className="text-[11px] font-bold text-[#F15A24] hover:text-[#D94E1F]"
                      >
                        Edit
                      </Link>
                    </div>
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