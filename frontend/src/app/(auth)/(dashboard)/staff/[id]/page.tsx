"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { clientFetch } from "@/lib/api";

interface StaffData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
}

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<StaffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    clientFetch(`/api/staff/${staffId}`)
      .then((result) => {
        if (result.success && result.data?.staff) {
          const s = result.data.staff;
          setStaff(s);
          setForm({
            fullName: s.full_name || "",
            phone: s.phone || "",
            status: s.status || "ACTIVE",
          });
        } else {
          setError("Staff member not found.");
        }
      })
      .catch(() => setError("Failed to load staff data."))
      .finally(() => setLoading(false));
  }, [staffId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setError("");
    setSuccess("");
    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    setSaving(true);
    try {
      const data = await clientFetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          status: form.status,
        }),
      });
      if (!data.success) throw new Error(data.message);
      setStaff(data.data.staff);
      setEditing(false);
      setSuccess("Staff member updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update staff.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (staff) {
      setForm({
        fullName: staff.full_name || "",
        phone: staff.phone || "",
        status: staff.status || "ACTIVE",
      });
    }
    setEditing(false);
    setError("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-[#F15A24] mb-3 block" />
          <p className="text-sm text-[#6B6B6B]">Loading staff details...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <i className="fa-solid fa-user-slash text-4xl text-[#9CA3AF] mb-4" />
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Staff Member Not Found</h2>
        <p className="text-sm text-[#6B6B6B] mb-6">{error || "The staff member you're looking for doesn't exist."}</p>
        <Link href="/staff" className="text-sm font-bold text-[#F15A24] hover:text-[#D94E1F]">
          <i className="fa-solid fa-arrow-left mr-2" />Back to Staff
        </Link>
      </div>
    );
  }

  const initials = (staff.full_name || "S M").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const joinedDate = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(staff.created_at));

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/staff" className="flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#F15A24] transition-colors">
          <i className="fa-solid fa-arrow-left text-xs" />
          Back to Staff
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/staff/${staffId}/permissions`}
            className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-sm font-medium bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-key text-[#9CA3AF] text-xs" />
            Permissions
          </Link>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-[#F15A24] text-white rounded-lg text-sm font-medium hover:bg-[#D94E1F] transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-pen text-xs" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
          <i className="fa-solid fa-circle-exclamation" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">
          <i className="fa-solid fa-circle-check" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm text-center">
            <div className="w-20 h-20 bg-[#1A1A1A] rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold mb-4">
              {initials}
            </div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">{staff.full_name}</h2>
            <p className="text-sm text-[#6B6B6B] mt-1">{staff.email}</p>
            <div className="mt-4 flex justify-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                staff.status === "ACTIVE" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              }`}>
                {staff.status}
              </span>
            </div>

            <div className="mt-6 pt-5 border-t border-[#F0F0F0] text-left space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <i className="fa-solid fa-phone text-[#9CA3AF] text-xs w-4 text-center" />
                <span className="text-[#6B6B6B]">{staff.phone || "No phone"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <i className="fa-solid fa-calendar text-[#9CA3AF] text-xs w-4 text-center" />
                <span className="text-[#6B6B6B]">Joined {joinedDate}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <i className="fa-solid fa-user-tie text-[#9CA3AF] text-xs w-4 text-center" />
                <span className="text-[#6B6B6B]">Staff Role</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details / Edit Form */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1A1A1A]">
                {editing ? "Edit Staff Member" : "Staff Details"}
              </h3>
              {editing && (
                <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full font-bold">
                  Editing
                </span>
              )}
            </div>

            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
                    placeholder="Staff full name"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#1A1A1A] py-2.5">{staff.full_name}</p>
                )}
              </div>

              {/* Email (always read-only) */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">
                  Email Address
                </label>
                <p className="text-sm text-[#6B6B6B] py-2.5">{staff.email}</p>
                {editing && (
                  <p className="text-[11px] text-[#9CA3AF] mt-1">
                    <i className="fa-solid fa-lock text-[10px] mr-1" />
                    Email cannot be changed
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
                    placeholder="+251 9XX XXX XXX"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#1A1A1A] py-2.5">{staff.phone || "—"}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">
                  Account Status
                </label>
                {editing ? (
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                ) : (
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    staff.status === "ACTIVE" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  }`}>
                    {staff.status}
                  </span>
                )}
              </div>

              {/* Joined */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">
                  Date Joined
                </label>
                <p className="text-sm text-[#6B6B6B] py-2.5">{joinedDate}</p>
              </div>
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[#F0F0F0]">
                <button
                  onClick={handleSave}
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
                  onClick={handleCancel}
                  className="text-sm font-bold text-[#6B6B6B] px-6 py-2.5 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
