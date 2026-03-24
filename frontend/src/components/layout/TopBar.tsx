// src/components/layout/TopBar.tsx

"use client";

import Link from "next/link";
import { getInitials } from "@/utils";
import type { AuthUser } from "@/types";

interface Props {
  user: AuthUser;
  onMenuClick: () => void;
}

export default function TopBar({ user, onMenuClick }: Props) {
  return (
    <header className="h-16 bg-white border-b border-[#E5E5E5] px-4 sm:px-6 flex items-center justify-between shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[#6B6B6B] hover:bg-[#F8F8F8] transition-colors"
      >
        <i className="fa-solid fa-bars text-sm" />
      </button>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3 sm:gap-4">
        {/* User info */}
        <Link href="/profile" className="flex items-center gap-3 hover:bg-[#F8F8F8] p-1.5 rounded-xl transition-colors group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#1A1A1A] leading-none group-hover:text-[#F15A24] transition-colors">{user.fullName}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5 capitalize">{user.role.toLowerCase()}</p>
          </div>
          {user.profilePhotoUrl ? (
            <img
              src={user.profilePhotoUrl}
              alt={user.fullName}
              className="w-9 h-9 rounded-full object-cover border-2 border-[#F15A24] group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#F15A24] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-white text-xs font-bold">{getInitials(user.fullName)}</span>
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}