// src/components/layout/TopBar.tsx
// Branch: feature/dashboard-layout (Thierry)

"use client";

import { getInitials } from "@/utils";
import type { AuthUser } from "@/types";

interface Props {
  user: AuthUser;
}

export default function TopBar({ user }: Props) {
  return (
    <header className="h-16 bg-white border-b border-[#E5E5E5] px-6 flex items-center justify-between shrink-0">
      <div />

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-[#6B6B6B] hover:bg-[#F8F8F8] transition-colors">
          <i className="fa-regular fa-bell text-sm" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F15A24] rounded-full" />
        </button>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#1A1A1A] leading-none">{user.fullName}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5 capitalize">{user.role.toLowerCase()}</p>
          </div>
          {user.profilePhotoUrl ? (
            <img
              src={user.profilePhotoUrl}
              alt={user.fullName}
              className="w-9 h-9 rounded-full object-cover border-2 border-[#F15A24]"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#F15A24] flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{getInitials(user.fullName)}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}