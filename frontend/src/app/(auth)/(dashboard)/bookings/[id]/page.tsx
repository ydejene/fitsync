"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { clientFetch } from "@/lib/api";

interface ClassData {
  id: string;
  name: string;
  name_am: string | null;
  instructor: string | null;
  location: string | null;
  schedule_at: string;
  duration_min: number;
  capacity: number;
  is_active: boolean;
  booked_count: string;
  created_at: string;
}

interface BookingData {
  id: string;
  booked_at: string;
  attended: boolean;
  cancelled: boolean;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

type Tab = "attendees" | "edit";

export default function ManageClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [cls, setCls] = useState<ClassData | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("attendees");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit form state
  const [form, setForm] = useState({
    name: "",
    nameAm: "",
    instructor: "",
    location: "",
    scheduleAt: "",
    durationMin: 60,
    capacity: 20,
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const result = await clientFetch(`/api/bookings/${classId}`);
      if (result.success) {
        setCls(result.data.fitnessClass);
        setBookings(result.data.bookings || []);
        const c = result.data.fitnessClass;
        setForm({
          name: c.name || "",
          nameAm: c.name_am || "",
          instructor: c.instructor || "",
          location: c.location || "",
          scheduleAt: c.schedule_at ? new Date(c.schedule_at).toISOString().slice(0, 16) : "",
          durationMin: c.duration_min || 60,
          capacity: c.capacity || 20,
        });
      } else {
        setError("Class not found.");
      }
    } catch {
      setError("Failed to load class.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "number" ? parseInt(value) || 0 : value }));
  };

  const handleSaveClass = async () => {
    setError(""); setSuccess("");
    if (!form.name.trim()) { setError("Class name is required."); return; }
    if (!form.scheduleAt) { setError("Schedule date/time is required."); return; }
    setSaving(true);
    try {
      const data = await clientFetch(`/api/bookings/${classId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          nameAm: form.nameAm || null,
          instructor: form.instructor || null,
          location: form.location || null,
          scheduleAt: form.scheduleAt,
          durationMin: form.durationMin,
          capacity: form.capacity,
        }),
      });
      if (!data.success) throw new Error(data.message);
      setCls(data.data.fitnessClass);
      setSuccess("Class updated successfully.");
      setTab("attendees");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update class.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAttended = async (bookingId: string, current: boolean) => {
    try {
      const data = await clientFetch(`/api/bookings/${classId}/booking/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify({ attended: !current }),
      });
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, attended: !current } : b))
        );
      }
    } catch {
      setError("Failed to update attendance.");
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      const data = await clientFetch(`/api/bookings/${classId}/booking/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify({ cancelled: true }),
      });
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, cancelled: true } : b))
        );
        setCls((prev) => prev ? { ...prev, booked_count: String(parseInt(prev.booked_count) - 1) } : prev);
        setSuccess("Booking cancelled.");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Failed to cancel booking.");
    }
  };

  const handleReinstateBooking = async (bookingId: string) => {
    try {
      const data = await clientFetch(`/api/bookings/${classId}/booking/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify({ cancelled: false }),
      });
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, cancelled: false } : b))
        );
        setCls((prev) => prev ? { ...prev, booked_count: String(parseInt(prev.booked_count) + 1) } : prev);
      }
    } catch {
      setError("Failed to reinstate booking.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-[#F15A24] mb-3 block" />
          <p className="text-sm text-[#6B6B6B]">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <i className="fa-solid fa-calendar-xmark text-4xl text-[#9CA3AF] mb-4" />
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Class Not Found</h2>
        <p className="text-sm text-[#6B6B6B] mb-6">{error || "This class doesn't exist."}</p>
        <Link href="/bookings" className="text-sm font-bold text-[#F15A24] hover:text-[#D94E1F]">
          <i className="fa-solid fa-arrow-left mr-2" />Back to Classes
        </Link>
      </div>
    );
  }

  const booked = parseInt(cls.booked_count || "0");
  const available = cls.capacity - booked;
  const isFull = available <= 0;
  const scheduleDate = new Date(cls.schedule_at);
  const isPast = scheduleDate < new Date();
  const activeBookings = bookings.filter((b) => !b.cancelled);
  const cancelledBookings = bookings.filter((b) => b.cancelled);

  const fmtDate = new Intl.DateTimeFormat("en-ET", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(scheduleDate);
  const fmtTime = new Intl.DateTimeFormat("en-ET", { hour: "2-digit", minute: "2-digit" }).format(scheduleDate);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/bookings" className="flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#F15A24] transition-colors">
          <i className="fa-solid fa-arrow-left text-xs" />
          Back to Classes
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
          <i className="fa-solid fa-circle-exclamation" />{error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><i className="fa-solid fa-xmark" /></button>
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">
          <i className="fa-solid fa-circle-check" />{success}
        </div>
      )}

      {/* Class Hero Card */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#1A1A1A]">{cls.name}</h1>
              {cls.name_am && <span className="text-sm text-[#9CA3AF]">({cls.name_am})</span>}
              {isPast && (
                <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500">Past</span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-[#6B6B6B] mt-3">
              <div className="flex items-center gap-2">
                <i className="fa-regular fa-calendar text-[#9CA3AF]" />
                <span>{fmtDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-regular fa-clock text-[#9CA3AF]" />
                <span>{fmtTime} · {cls.duration_min} min</span>
              </div>
              {cls.instructor && (
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-user-tie text-[#9CA3AF]" />
                  <span>{cls.instructor}</span>
                </div>
              )}
              {cls.location && (
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-location-dot text-[#9CA3AF]" />
                  <span>{cls.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="bg-[#FAFAFA] rounded-xl px-5 py-3 text-center min-w-[90px]">
              <p className="text-2xl font-bold text-[#1A1A1A]">{booked}</p>
              <p className="text-[10px] text-[#9CA3AF] uppercase font-bold mt-0.5">Booked</p>
            </div>
            <div className="bg-[#FAFAFA] rounded-xl px-5 py-3 text-center min-w-[90px]">
              <p className={`text-2xl font-bold ${isFull ? "text-red-600" : "text-green-600"}`}>{available}</p>
              <p className="text-[10px] text-[#9CA3AF] uppercase font-bold mt-0.5">Available</p>
            </div>
            <div className="bg-[#FAFAFA] rounded-xl px-5 py-3 text-center min-w-[90px]">
              <p className="text-2xl font-bold text-[#1A1A1A]">{cls.capacity}</p>
              <p className="text-[10px] text-[#9CA3AF] uppercase font-bold mt-0.5">Capacity</p>
            </div>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="mt-5">
          <div className="w-full bg-[#F0F0F0] rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${isFull ? "bg-red-500" : "bg-[#F15A24]"}`}
              style={{ width: `${Math.min((booked / cls.capacity) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-1.5">
            {Math.round((booked / cls.capacity) * 100)}% capacity filled
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#F5F5F5] rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("attendees")}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === "attendees" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#9CA3AF] hover:text-[#6B6B6B]"
          }`}
        >
          <i className="fa-solid fa-users mr-2 text-xs" />
          Attendees ({activeBookings.length})
        </button>
        <button
          onClick={() => setTab("edit")}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === "edit" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#9CA3AF] hover:text-[#6B6B6B]"
          }`}
        >
          <i className="fa-solid fa-pen mr-2 text-xs" />
          Edit Class
        </button>
      </div>

      {/* Attendees Tab */}
      {tab === "attendees" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden">
          {activeBookings.length === 0 ? (
            <div className="p-16 text-center text-[#9CA3AF]">
              <i className="fa-solid fa-users-slash text-3xl block mb-3" />
              <p className="font-medium">No bookings yet</p>
              <p className="text-sm mt-1">Members can book this class from their dashboard</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                  <th className="px-5 py-3 font-semibold text-[#9CA3AF]">Member</th>
                  <th className="px-5 py-3 font-semibold text-[#9CA3AF] hidden md:table-cell">Phone</th>
                  <th className="px-5 py-3 font-semibold text-[#9CA3AF] hidden lg:table-cell">Booked At</th>
                  <th className="px-5 py-3 font-semibold text-[#9CA3AF] text-center">Attended</th>
                  <th className="px-5 py-3 font-semibold text-[#9CA3AF] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {activeBookings.map((b) => {
                  const initials = (b.full_name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <tr key={b.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#F15A24] flex items-center justify-center shrink-0">
                            <span className="text-white text-[10px] font-bold">{initials}</span>
                          </div>
                          <div>
                            <p className="font-bold text-[#1A1A1A]">{b.full_name}</p>
                            <p className="text-[11px] text-[#9CA3AF]">{b.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#6B6B6B] hidden md:table-cell">{b.phone || "—"}</td>
                      <td className="px-5 py-4 text-[#6B6B6B] text-xs hidden lg:table-cell">
                        {new Intl.DateTimeFormat("en-ET", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(b.booked_at))}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleToggleAttended(b.id, b.attended)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            b.attended
                              ? "bg-green-100 text-green-600 hover:bg-green-200"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                          title={b.attended ? "Mark as not attended" : "Mark as attended"}
                        >
                          <i className={`fa-solid ${b.attended ? "fa-check" : "fa-minus"} text-xs`} />
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="text-[11px] px-3 py-1.5 border border-red-200 rounded-lg font-bold text-red-500 hover:bg-red-50 transition-all"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Cancelled bookings */}
          {cancelledBookings.length > 0 && (
            <div className="border-t border-[#E5E5E5]">
              <div className="px-5 py-3 bg-[#FAFAFA]">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase">Cancelled ({cancelledBookings.length})</p>
              </div>
              <div className="divide-y divide-[#F0F0F0]">
                {cancelledBookings.map((b) => (
                  <div key={b.id} className="px-5 py-3 flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-[9px] font-bold">
                          {(b.full_name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-[#6B6B6B] line-through">{b.full_name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{b.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReinstateBooking(b.id)}
                      className="text-[11px] px-3 py-1 border border-[#E5E5E5] rounded-lg font-bold text-[#6B6B6B] hover:bg-gray-50 transition-all"
                    >
                      Reinstate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Tab */}
      {tab === "edit" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm p-6 max-w-2xl">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Edit Class Details</h3>

          <div className="space-y-5">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Class Name *</label>
                <input
                  type="text" name="name" value={form.name} onChange={handleFormChange}
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
                  placeholder="e.g. Morning Yoga"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Name (Amharic)</label>
                <input
                  type="text" name="nameAm" value={form.nameAm} onChange={handleFormChange}
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Instructor & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Instructor</label>
                <input
                  type="text" name="instructor" value={form.instructor} onChange={handleFormChange}
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
                  placeholder="Instructor name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Location</label>
                <input
                  type="text" name="location" value={form.location} onChange={handleFormChange}
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
                  placeholder="e.g. Studio A"
                />
              </div>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Schedule Date & Time *</label>
              <input
                type="datetime-local" name="scheduleAt" value={form.scheduleAt} onChange={handleFormChange}
                className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
              />
            </div>

            {/* Duration & Capacity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Duration (min)</label>
                <input
                  type="number" name="durationMin" value={form.durationMin} onChange={handleFormChange} min={15} max={240}
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Capacity</label>
                <input
                  type="number" name="capacity" value={form.capacity} onChange={handleFormChange} min={1} max={200}
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[#F0F0F0]">
            <button
              onClick={handleSaveClass}
              disabled={saving}
              className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
              ) : (
                <><i className="fa-solid fa-floppy-disk" /> Save Changes</>
              )}
            </button>
            <button
              onClick={() => setTab("attendees")}
              className="text-sm font-bold text-[#6B6B6B] px-6 py-2.5 hover:bg-gray-100 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
