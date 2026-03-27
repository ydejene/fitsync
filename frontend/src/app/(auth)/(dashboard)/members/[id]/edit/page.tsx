"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { clientFetch } from "@/lib/api";
import { getRequiredFieldMessage } from "@/utils/validation";
import type { Gender } from "@/types";

interface MemberData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  gender: Gender | null;
  status: string;
  created_at: string;
}

interface MemberForm {
  fullName: string;
  phone: string;
  address: string;
  gender: Gender | "";
  status: string;
}

type MemberField = keyof MemberForm;

export default function EditMemberPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<MemberField, string>>>({});

  const [form, setForm] = useState<MemberForm>({
    fullName: "",
    phone: "",
    address: "",
    gender: "",
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
            gender: m.gender || "",
            status: m.status || "ACTIVE",
          });
        } else {
          setError("Member not found.");
        }
      })
      .catch(() => setError("Failed to load member data."))
      .finally(() => setLoading(false));
  }, [memberId]);

  function handleChange<T extends MemberField>(field: T, value: MemberForm[T]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (error) setError("");
    if (success) setSuccess("");
  }

  function validateForm() {
    const nextErrors: Partial<Record<MemberField, string>> = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = getRequiredFieldMessage("Full name");
    }
    if (!form.gender) {
      nextErrors.gender = getRequiredFieldMessage("Gender");
    }

    return nextErrors;
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    const nextErrors = validateForm();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError(Object.values(nextErrors)[0] || "Please review the highlighted fields.");
      return;
    }

    setSaving(true);

    try {
      const data = await clientFetch(`/api/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          gender: form.gender,
          status: form.status,
        }),
      });

      if (!data.success) throw new Error(data.message || "Failed to update member.");

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
  }

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

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm"
        >
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm"
        >
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
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
            <p className="text-xs text-[#9CA3AF]">
              Member since {new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long" }).format(new Date(member.created_at))}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2" htmlFor="member-edit-full-name">
              Full Name *
            </label>
            <input
              id="member-edit-full-name"
              type="text"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? "member-edit-full-name-error" : undefined}
              className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
              placeholder="e.g. Abebe Tadesse"
            />
            {fieldErrors.fullName && (
              <p id="member-edit-full-name-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.fullName}
              </p>
            )}
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2" htmlFor="member-edit-phone">
                Phone Number
              </label>
              <input
                id="member-edit-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent"
                placeholder="+251 9XX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2" htmlFor="member-edit-gender">
                Gender *
              </label>
              <select
                id="member-edit-gender"
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value as MemberForm["gender"])}
                aria-invalid={Boolean(fieldErrors.gender)}
                aria-describedby={fieldErrors.gender ? "member-edit-gender-error" : undefined}
                className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent bg-white"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              {fieldErrors.gender && (
                <p id="member-edit-gender-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.gender}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2" htmlFor="member-edit-status">
                Status
              </label>
              <select
                id="member-edit-status"
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2" htmlFor="member-edit-address">
              Address
            </label>
            <textarea
              id="member-edit-address"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent resize-none"
              placeholder="Addis Ababa, Ethiopia"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[#F0F0F0]">
          <button
            onClick={handleSave}
            type="button"
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
