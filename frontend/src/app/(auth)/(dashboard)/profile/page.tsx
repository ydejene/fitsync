"use client";

import { useState, useEffect } from "react";
import { clientFetch } from "@/lib/api";
import type { AuthUser, ApiResponse } from "@/types";
import { getInitials } from "@/utils";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const formData = new FormData();
    formData.append("photo", file);

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      // Use standard fetch for FormData since clientFetch might be JSON-only or not handle FormData
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/users/profile/photo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        setUser({ ...user, profilePhotoUrl: data.data.profilePhotoUrl });
        setMessage({ text: "Photo updated successfully!", type: "success" });
      } else {
        setMessage({ text: data.message || "Failed to upload photo", type: "error" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ text: "Error uploading photo", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  function handleRemovePhoto() {
    if (!user) return;
    setUser({ ...user, profilePhotoUrl: undefined });
    setMessage({ text: "Photo removed! Click 'Save Changes' to confirm.", type: "success" });
  }

  async function fetchProfile() {
    try {
      const res = await clientFetch<{ user: AuthUser }>("/api/auth/me");
      if (res.success && res.data) {
        setUser(res.data.user);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await clientFetch<any>("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify(user),
      });

      if (res.success) {
        setMessage({ text: "Profile updated successfully!", type: "success" });
        router.refresh();
      } else {
        setMessage({ text: res.message || "Failed to update profile", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Error connecting to server", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="fa-solid fa-spinner fa-spin text-[#F15A24] text-2xl" />
      </div>
    );
  }

  if (!user) return <div>User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title text-2xl font-bold text-[#1A1A1A]">Personal Profile</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Manage your account information and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 flex flex-col items-center text-center shadow-sm">
            <div className="relative group">
              <input 
                type="file" 
                id="photoInput" 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoUpload}
              />
              {user.profilePhotoUrl ? (
                <img
                  src={user.profilePhotoUrl}
                  alt={user.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#F15A24] flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-md">
                  {getInitials(user.fullName)}
                </div>
              )
              }
              <button 
                type="button"
                onClick={() => document.getElementById('photoInput')?.click()}
                className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full shadow-sm border border-[#E5E5E5] flex items-center justify-center text-[#6B6B6B] hover:text-[#F15A24] transition-colors"
                title="Change Photo"
              >
                <i className="fa-solid fa-camera text-xs" />
              </button>
              {user.profilePhotoUrl && (
                <button 
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute bottom-1 -left-1 w-8 h-8 bg-white rounded-full shadow-sm border border-[#E5E5E5] flex items-center justify-center text-[#6B6B6B] hover:text-red-500 transition-colors"
                  title="Remove Photo"
                >
                  <i className="fa-solid fa-trash-can text-xs" />
                </button>
              )}
            </div>
            
            <h2 className="mt-4 text-xl font-bold text-[#1A1A1A]">{user.fullName}</h2>
            <p className="text-sm text-[#F15A24] font-medium uppercase tracking-wider mt-1">{user.role}</p>
            
            <div className="w-full mt-6 pt-6 border-t border-[#F0F0F0]">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[#6B6B6B] text-xs uppercase tracking-wider font-semibold">Email Address</span>
                <span className="text-[#1A1A1A] font-medium text-sm break-all">{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-6 flex items-center gap-2">
              <i className="fa-solid fa-user-pen text-[#F15A24]" />
              Account Details
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 focus:border-[#F15A24] transition-all"
                    value={user.fullName}
                    onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 focus:border-[#F15A24] transition-all"
                    value={user.phone || ""}
                    placeholder="+251-XXX-XXXXXX"
                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-1.5">Gender</label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 focus:border-[#F15A24] transition-all capitalize"
                    value={user.gender || ""}
                    onChange={(e) => setUser({ ...user, gender: e.target.value as any })}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-1.5">WhatsApp (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 focus:border-[#F15A24] transition-all"
                    value={user.whatsappNumber || ""}
                    placeholder="+251-XXX-XXXXXX"
                    onChange={(e) => setUser({ ...user, whatsappNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 focus:border-[#F15A24] transition-all"
                    value={user.dob ? user.dob.split('T')[0] : ""}
                    onChange={(e) => setUser({ ...user, dob: e.target.value })}
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-1.5">Address</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 focus:border-[#F15A24] transition-all resize-none"
                    value={user.address || ""}
                    placeholder="Addis Ababa, Ethiopia..."
                    onChange={(e) => setUser({ ...user, address: e.target.value })}
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-1.5">Emergency Contact</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 focus:border-[#F15A24] transition-all resize-none"
                    value={user.emergencyContact || ""}
                    placeholder="Name - Phone Relation..."
                    onChange={(e) => setUser({ ...user, emergencyContact: e.target.value })}
                  />
                </div>
              </div>
              {message.text && (
                <div className={`p-4 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                  message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                }`}>
                  <i className={`fa-solid ${message.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`} />
                  {message.text}
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t border-[#F0F0F0]">
                <button type="submit" className="bg-[#F15A24] hover:bg-[#D94E1F] text-white px-8 py-2.5 rounded-xl font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100" disabled={saving}>
                  {saving ? (
                    <><i className="fa-solid fa-spinner fa-spin mr-2" /> Saving...</>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => fetchProfile()}
                  className="text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );


}
