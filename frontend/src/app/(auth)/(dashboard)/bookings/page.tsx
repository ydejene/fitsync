import { requireAdminOrStaff } from "@/lib/auth";
import { apiFetch } from "@/lib/api.server";
import { formatDateTime } from "@/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Class Bookings" };

async function getClasses() {
  try {
    const result = await apiFetch("/api/bookings");
    if (!result.success) return [];
    return result.data?.classes || [];
  } catch (error) {
    console.error("Bookings Fetch Error:", error);
    return [];
  }
}

export default async function BookingsPage() {
  await requireAdminOrStaff();
  const classes = await getClasses();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Class Bookings</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">{classes.length} upcoming classes</p>
        </div>
        <Link 
          href="/bookings/new" 
          className="bg-[#F15A24] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#D94E1F] transition-colors flex items-center gap-2"
        >
          <i className="fa-solid fa-plus text-xs" />
          Add Class
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.length === 0 ? (
          <div className="col-span-full bg-white border border-[#E5E5E5] rounded-2xl p-16 text-center text-[#9CA3AF]">
            <i className="fa-solid fa-calendar-days text-3xl block mb-3" />
            <p className="font-medium">No upcoming classes</p>
            <p className="text-sm mt-1">Add a class to get started</p>
          </div>
        ) : (
          classes.map((cls: any) => {
            const booked = parseInt(cls.booked_count || 0);
            const available = cls.capacity - booked;
            const isFull = available <= 0;

            return (
              <div key={cls.id} className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A] leading-tight">
                      {cls.name}
                    </h3>
                    {cls.name_am && (
                      <p className="text-xs text-[#9CA3AF] mt-0.5">{cls.name_am}</p>
                    )}
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                    isFull ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                  }`}>
                    {isFull ? "Full" : `${available} spots`}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-[#6B6B6B] mb-4">
                  <div className="flex items-center gap-2">
                    <i className="fa-regular fa-clock w-4 text-[#9CA3AF]" />
                    <span>{formatDateTime(cls.schedule_at)} · {cls.duration_min} min</span>
                  </div>
                  {cls.instructor && (
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-user-tie w-4 text-[#9CA3AF]" />
                      <span>{cls.instructor}</span>
                    </div>
                  )}
                  {cls.location && (
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-location-dot w-4 text-[#9CA3AF]" />
                      <span>{cls.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F5]">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {Array.from({ length: Math.min(booked, 4) }).map((_, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-[#F15A24] border-2 border-white flex items-center justify-center text-[8px] text-white">
                          <i className="fa-solid fa-user" />
                        </div>
                      ))}
                      {booked > 4 && (
                        <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] text-gray-500 font-bold">
                          +{booked - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[#9CA3AF] ml-1">{booked}/{cls.capacity}</span>
                  </div>
                  <Link
                    href={`/bookings/${cls.id}`}
                    className="text-xs font-bold text-[#F15A24] hover:text-[#D94E1F]"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}