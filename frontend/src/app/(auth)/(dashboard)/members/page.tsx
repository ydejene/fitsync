import { requireAdminOrStaff } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import { formatDate } from "@/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Members" };

interface SearchParams {
  q?: string;
  status?: string;
  page?: string;
}

async function getMembersData(page: number, q: string, status: string) {
  const query = new URLSearchParams({
    page: page.toString(),
    q,
    status,
  }).toString();

  const result = await apiFetch(`/api/members?${query}`);
  if (!result.success) return { members: [], total: 0 };
  return result.data;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminOrStaff();

  const page = parseInt(searchParams.page ?? "1");
  const q = searchParams.q ?? "";
  const status = searchParams.status ?? "";
  const pageSize = 20;

  const { members, total } = await getMembersData(page, q, status);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">{total} total members</p>
        </div>
        <Link href="/members/new" className="bg-[#F15A24] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#D94E1F] transition-colors flex items-center gap-2">
          <i className="fa-solid fa-user-plus text-xs" />
          Add Member
        </Link>
      </div>

      <div className="card p-4 mb-5 flex flex-wrap items-center gap-3 bg-white border border-[#E5E5E5] rounded-xl">
        <form className="flex-1 flex items-center gap-3 min-w-0">
          <div className="relative flex-1 min-w-0 max-w-sm">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-xs" />
            <input
              name="q"
              defaultValue={q}
              className="w-full pl-9 p-2 border border-[#E5E5E5] rounded-lg outline-none focus:ring-1 focus:ring-[#F15A24]"
              placeholder="Search by name, email, phone..."
            />
          </div>
          <select name="status" defaultValue={status} className="p-2 border border-[#E5E5E5] rounded-lg outline-none bg-white">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button type="submit" className="bg-[#F15A24] text-white px-4 py-2 rounded-lg font-medium">
            Filter
          </button>
        </form>
      </div>

      <div className="card overflow-hidden bg-white border border-[#E5E5E5] rounded-xl shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
              <th className="px-4 py-3 font-semibold text-[#9CA3AF]">Member</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF] hidden md:table-cell">Phone</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF] hidden lg:table-cell">Plan</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF]">Status</th>
              <th className="px-4 py-3 font-semibold text-[#9CA3AF] hidden lg:table-cell">Joined</th>
              <th className="px-4 py-3 font-semibold text-right text-[#9CA3AF]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-[#9CA3AF]">
                  No members found
                </td>
              </tr>
            ) : (
              members.map((member: any) => (
                <tr key={member.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F15A24] flex items-center justify-center text-white text-xs font-bold">
                        {member.full_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{member.full_name}</p>
                        <p className="text-xs text-[#9CA3AF]">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B] hidden md:table-cell">{member.phone ?? "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-[#1A1A1A]">{member.current_plan ?? "No plan"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${member.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B] hidden lg:table-cell">{formatDate(member.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/members/${member.id}`} className="text-[#F15A24] hover:underline font-medium">View</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#E5E5E5] flex items-center justify-between bg-white">
            <span className="text-xs text-[#9CA3AF]">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/members?page=${page - 1}&q=${q}&status=${status}`} className="px-3 py-1 border rounded text-xs">Previous</Link>
              )}
              {page < totalPages && (
                <Link href={`/members?page=${page + 1}&q=${q}&status=${status}`} className="px-3 py-1 border rounded text-xs">Next</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}