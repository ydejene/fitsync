"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface Props {
  defaultSearch: string;
  defaultStatus: string;
  defaultSubStatus: string;
}

export default function GymsFilterBar({ defaultSearch, defaultStatus, defaultSubStatus }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(defaultSearch);
  const [status, setStatus] = useState(defaultStatus);
  const [subStatus, setSubStatus] = useState(defaultSubStatus);

  const apply = useCallback(
    (overrides: Partial<{ search: string; status: string; subStatus: string }> = {}) => {
      const s = overrides.search ?? search;
      const st = overrides.status ?? status;
      const sub = overrides.subStatus ?? subStatus;

      const qs = new URLSearchParams();
      if (s) qs.set("search", s);
      if (st) qs.set("status", st);
      if (sub) qs.set("subStatus", sub);
      router.push(`/admin/gyms${qs.toString() ? `?${qs}` : ""}`);
    },
    [search, status, subStatus, router]
  );

  return (
    <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-500">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm group">
        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-xs transition-colors group-focus-within:text-[#F15A24]" />
        <input
          type="text"
          id="admin-gyms-search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-[#E5E5E5] bg-white text-[#1A1A1A] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#F15A24]/40 focus:ring-2 focus:ring-[#F15A24]/10 transition-all shadow-sm group-hover:border-[#CED4DA]"
        />
      </div>

      {/* Account status filter */}
      <select
        id="admin-gyms-status-filter"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          apply({ status: e.target.value });
        }}
        className="h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-[#1A1A1A] text-sm focus:outline-none focus:border-[#F15A24]/40 focus:ring-2 focus:ring-[#F15A24]/10 transition-all cursor-pointer shadow-sm hover:border-[#CED4DA]"
      >
        <option value="">All Accounts</option>
        <option value="ACTIVE">Account Active</option>
        <option value="INACTIVE">Account Inactive</option>
      </select>

      {/* Subscription status filter */}
      <select
        id="admin-gyms-sub-filter"
        value={subStatus}
        onChange={(e) => {
          setSubStatus(e.target.value);
          apply({ subStatus: e.target.value });
        }}
        className="h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-[#1A1A1A] text-sm focus:outline-none focus:border-[#F15A24]/40 focus:ring-2 focus:ring-[#F15A24]/10 transition-all cursor-pointer shadow-sm hover:border-[#CED4DA]"
      >
        <option value="">All Subscriptions</option>
        <option value="active">Subscribed</option>
        <option value="pending">Pending</option>
        <option value="expired">Expired</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {/* Search button */}
      <button
        type="button"
        onClick={() => apply()}
        className="h-10 px-5 rounded-xl text-white text-sm font-bold transition-all cursor-pointer shadow-sm hover:shadow-md hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-sm"
        style={{ backgroundColor: "#F15A24" }}
      >
        Search
      </button>

      {/* Clear */}
      {(search || status || subStatus) && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatus("");
            setSubStatus("");
            router.push("/admin/gyms");
          }}
          className="h-10 px-4 rounded-xl text-[#9CA3AF] hover:text-[#F15A24] text-xs font-bold transition-all cursor-pointer border border-transparent hover:border-[#F15A24]/10 hover:bg-[#F15A24]/5"
        >
          Clear
        </button>
      )}
    </div>
  );
}
