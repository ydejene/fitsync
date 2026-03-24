"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { clientFetch } from "@/lib/api";

interface MemberData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  dob: string | null;
  status: string;
  created_at: string;
}

export default function EditMemberPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    clientFetch(`/api/members/${memberId}`)
      .then((result) => {
        if (result.success && result.data?.member) {
          const m = result.data.member;
          setMember(m);
          setForm({
            fullName: m.full_name || "",
            phone: m.phone || "",
            address: m.address || "",
            status: m.status || "ACTIVE",
          });
        } else {
          setError("Member not found.");
        }
      })
      .catch(() => setError("Failed to load member data."))
      .finally(() => setLoading(false));
  }, [memberId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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
      const data = await clientFetch(`/api/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          status: form.status,
        }),
      });
      if (!data.success) throw new Error(data.message);
      setSuccess("Member updated successfully.");
      setTimeout(() => {
        router.push(`/members/${memberId}`);
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update member.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-[#F15A24] mb-3 block" />
          <p className="text-sm text-[#6B6B6B]">Loading member details...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-center">
        <i className="fa-solid fa-user-slash text-4xl text-[#9CA3AF] mb-4" />
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Member Not Found</h2>
        <p className="text-sm text-[#6B6B6B] mb-6">{error || "The member you're looking for doesn't exist."}</p>
        <Link href="/members" className="text-sm font-bold text-[#F15A24] hover:text-[#D94E1F]">
          <i className="fa-solid fa-arrow-left mr-2" />Back to Members
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/members/${memberId}`} className="flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#F15A24] transition-colors mb-2">
            <i className="fa-solid fa-arrow-left text-xs" />
            Back to Profile
          </Link>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Edit Member</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">{member.email}</p>
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

      <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#F0F0F0]">
          <div className="w-14 h-14 bg-[#F15A24] rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0">
            {(member.full_name || "").substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-[#1A1A1A]">{member.full_name}</h2>
            <p className="text-xs text-[#9CA3AF]">Member since {new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long" }).format(new Date(member.created_at))}</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
              placeholder="e.g. Abebe Tadesse"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">
              Email Address
            </label>
            <p className="text-sm text-[#6B6B6B] py-2.5 px-4 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0]">
              {member.email}
            </p>
            <p className="text-[11px] text-[#9CA3AF] mt-1">
              <i className="fa-solid fa-lock text-[10px] mr-1" />
              Email cannot be changed
            </p>
          </div>

          {/* Phone & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
                placeholder="+251 9XX XXX XXX"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent resize-none"
              placeholder="Addis Ababa, Ethiopia"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[#F0F0F0]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#F15A24] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#D94E1F] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
            ) : (
              <><i className="fa-solid fa-floppy-disk" /> Save Changes</>
            )}
          </button>
          <Link
            href={`/members/${memberId}`}
            className="text-sm font-bold text-[#6B6B6B] px-6 py-2.5 hover:bg-gray-100 rounded-xl transition-all"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
