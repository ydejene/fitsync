// src/app/(auth)/admin/gyms/page.tsx
// Admin - List of all gyms — Light Mode

import { requireAdmin } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import type { Metadata } from "next";
import GymStatusToggle from "../GymStatusToggle";
import GymsFilterBar from "./GymsFilterBar";

export const metadata: Metadata = { title: "All Gyms | Admin Console" };

interface SearchParams { page?: string; search?: string; status?: string; subStatus?: string; }

function StatusBadge({ status, sub }: { status: string; sub: string }) {
  if (status === "INACTIVE")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-100">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        Deactivated
      </span>
    );
  if (sub === "active")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-50 text-green-600 border border-green-100">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Active
      </span>
    );
  if (sub === "pending")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-100">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-400 border border-gray-100">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      {sub ?? "—"}
    </span>
  );
}

export default async function AllGymsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();

  const params = await searchParams;
  const page = params.page || "1";
  const search = params.search || "";
  const status = params.status || "";
  const subStatus = params.subStatus || "";

  const qs = new URLSearchParams({ page, ...(search && { search }), ...(status && { status }), ...(subStatus && { subStatus }) });
  const result = await apiFetch(`/api/admin/gyms?${qs}`);
  const data = result.success ? result.data : null;

  const gyms = data?.gyms ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = parseInt(page);

  const buildPageUrl = (p: number) => {
    const q = new URLSearchParams({ page: String(p), ...(search && { search }), ...(status && { status }), ...(subStatus && { subStatus }) });
    return `/admin/gyms?${q}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight font-display">
            All Gyms
          </h1>
          <p className="text-sm mt-1 text-[#6B6B6B]">
            {total} gym{total !== 1 ? "s" : ""} registered on the platform
          </p>
        </div>
      </div>

      <GymsFilterBar defaultSearch={search} defaultStatus={status} defaultSubStatus={subStatus} />

      <div className="rounded-2xl bg-white border border-[#E5E5E5] shadow-sm overflow-hidden">
        {gyms.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8F8F8] border-b border-[#F0F0F0]">
                    {["Gym Owner", "Plan", "Status", "Renews", "Joined", "Action"].map((h, i) => (
                      <th key={h} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] ${i === 5 ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {gyms.map((gym: any) => (
                    <tr key={gym.id} className="hover:bg-[#FFFBF9] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold bg-[#F15A24] border border-[#F15A24]/10 shadow-sm">
                            {gym.fullName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1A1A1A]">{gym.fullName}</p>
                            <p className="text-xs text-[#9CA3AF]">{gym.email}</p>
                            {gym.phone && <p className="text-[10px] text-gray-300 mt-0.5">{gym.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {gym.planName ? (
                          <div>
                            <p className="font-semibold text-[#6B6B6B]">{gym.planName}</p>
                            {gym.planPrice != null && (
                              <p className="text-xs text-[#9CA3AF]">
                                ETB {gym.planPrice.toLocaleString()}/{gym.billingCycle?.toLowerCase()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs italic text-gray-300">No plan</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={gym.status} sub={gym.subscriptionStatus} />
                      </td>
                      <td className="px-6 py-4 text-sm text-[#9CA3AF]">
                        {gym.subscriptionEnd
                          ? new Date(gym.subscriptionEnd).toLocaleDateString("en-ET", { day: "numeric", month: "short", year: "numeric" })
                          : <span className="text-gray-300 italic">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#9CA3AF]">
                        {new Date(gym.createdAt).toLocaleDateString("en-ET", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <GymStatusToggle gymId={gym.id} gymName={gym.fullName} currentStatus={gym.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-5 flex items-center justify-between border-t border-[#F0F0F0] bg-[#F8F8F8]/50">
                <p className="text-xs text-[#9CA3AF]">
                  Showing <span className="text-[#1A1A1A] font-semibold">{(currentPage - 1) * 20 + 1}–{Math.min(currentPage * 20, total)}</span> of <span className="text-[#1A1A1A] font-semibold">{total}</span>
                </p>
                <div className="flex items-center gap-3">
                  {currentPage > 1 && (
                    <a href={buildPageUrl(currentPage - 1)}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E5E5E5] text-[#1A1A1A] hover:bg-[#F5F5F5] transition-all shadow-sm">
                      ← Prev
                    </a>
                  )}
                  <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                    Page {currentPage} of {totalPages}
                  </span>
                  {currentPage < totalPages && (
                    <a href={buildPageUrl(currentPage + 1)}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E5E5E5] text-[#1A1A1A] hover:bg-[#F5F5F5] transition-all shadow-sm">
                      Next →
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-building text-2xl text-gray-300" />
            </div>
            <p className="text-sm text-[#9CA3AF]">No gyms found matching your filters</p>
            {(search || status || subStatus) && (
              <a href="/admin/gyms" className="text-xs font-semibold text-[#F15A24] mt-3 inline-block hover:underline">
                Clear all filters
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
