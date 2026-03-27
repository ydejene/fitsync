"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/api";
import { getRequiredFieldMessage, isValidEmail } from "@/utils/validation";
import type { Gender } from "@/types";

type MemberForm = {
  fullName: string;
  email: string;
  phone: string;
  gender: Gender | "";
};

type MemberField = keyof MemberForm;

const INITIAL_FORM: MemberForm = {
  fullName: "",
  email: "",
  phone: "",
  gender: "",
};

export default function NewMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<MemberForm>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<MemberField, string>>>({});

  function updateField<T extends MemberField>(field: T, value: MemberForm[T]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (error) setError("");
  }

  function validateForm() {
    const nextErrors: Partial<Record<MemberField, string>> = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = getRequiredFieldMessage("Full name");
    }
    if (!formData.email.trim()) {
      nextErrors.email = getRequiredFieldMessage("Email address");
    } else if (!isValidEmail(formData.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!formData.gender) {
      nextErrors.gender = getRequiredFieldMessage("Gender");
    }

    return nextErrors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = validateForm();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError(Object.values(nextErrors)[0] || "Please review the highlighted fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await clientFetch("/api/members", {
        method: "POST",
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          gender: formData.gender,
          password: "password123",
        }),
      });

      if (data.success) {
        router.push("/members");
        router.refresh();
        return;
      }

      setError(data.message || "Failed to create member.");
    } catch (err) {
      console.error("Create Member Error:", err);
      setError("Failed to create member.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Register New Member</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Create a member account for gym operations and reporting.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl border border-[#E5E5E5] shadow-sm space-y-5"
        noValidate
      >
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm"
          >
            <i className="fa-solid fa-circle-exclamation mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="label" htmlFor="member-full-name">Full Name *</label>
          <input
            id="member-full-name"
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            aria-invalid={Boolean(fieldErrors.fullName)}
            aria-describedby={fieldErrors.fullName ? "member-full-name-error" : undefined}
            className="input"
            placeholder="e.g. Abebe Tadesse"
          />
          {fieldErrors.fullName && (
            <p id="member-full-name-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="member-email">Email Address *</label>
            <input
              id="member-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "member-email-error" : undefined}
              className="input"
              placeholder="member@fitsync.et"
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p id="member-email-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="member-gender">Gender *</label>
            <select
              id="member-gender"
              required
              value={formData.gender}
              onChange={(e) => updateField("gender", e.target.value as MemberForm["gender"])}
              aria-invalid={Boolean(fieldErrors.gender)}
              aria-describedby={fieldErrors.gender ? "member-gender-error" : undefined}
              className="input bg-white"
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            {fieldErrors.gender && (
              <p id="member-gender-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.gender}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="member-phone">
            Phone Number
            <span className="ml-1 text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="member-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="input"
            placeholder="+251 9XX XXX XXX"
            autoComplete="tel"
          />
        </div>

        <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-sm text-[#6B6B6B]">
          New member accounts currently use the team default starter password and should be updated during onboarding.
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading ? "Registering..." : "Create Member Account"}
        </button>
      </form>
    </div>
  );
}
