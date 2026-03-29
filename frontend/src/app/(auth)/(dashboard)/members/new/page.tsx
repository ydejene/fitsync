"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/api";
import { getRequiredFieldMessage, isValidEmail } from "@/utils/validation";
import type { Gender } from "@/types";

type MemberForm = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  gender: Gender | "";
  dateOfBirth: string;
  address: string;
  whatsappNumber: string;
  emergencyContact: string;
};

type MemberField = keyof MemberForm;

const INITIAL_FORM: MemberForm = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  whatsappNumber: "",
  emergencyContact: "",
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
    if (!formData.password.trim()) {
      nextErrors.password = getRequiredFieldMessage("Password");
    } else if (formData.password.trim().length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
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
          password: formData.password.trim(),
          phone: formData.phone.trim() || undefined,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth || undefined,
          address: formData.address.trim() || undefined,
          whatsappNumber: formData.whatsappNumber.trim() || undefined,
          emergencyContact: formData.emergencyContact.trim() || undefined,
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

        {/* Full Name */}
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
            placeholder="e.g. John Doe"
          />
          {fieldErrors.fullName && (
            <p id="member-full-name-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        {/* Email + Password */}
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
              placeholder="member@example.com"
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p id="member-email-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="member-password">Password *</label>
            <input
              id="member-password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "member-password-error" : undefined}
              className="input"
              placeholder="Min. 6 characters"
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <p id="member-password-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>
        </div>

        {/* Gender + Date of Birth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label className="label" htmlFor="member-dob">
              Date of Birth
              <span className="ml-1 text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="member-dob"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => updateField("dateOfBirth", e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Phone + WhatsApp */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="+1 234 567 8900"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="label" htmlFor="member-whatsapp">
              WhatsApp Number
              <span className="ml-1 text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="member-whatsapp"
              type="tel"
              value={formData.whatsappNumber}
              onChange={(e) => updateField("whatsappNumber", e.target.value)}
              className="input"
              placeholder="+1 234 567 8900"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="label" htmlFor="member-address">
            Address
            <span className="ml-1 text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="member-address"
            type="text"
            value={formData.address}
            onChange={(e) => updateField("address", e.target.value)}
            className="input"
            placeholder="Street address, city"
          />
        </div>

        {/* Emergency Contact */}
        <div>
          <label className="label" htmlFor="member-emergency">
            Emergency Contact
            <span className="ml-1 text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="member-emergency"
            type="text"
            value={formData.emergencyContact}
            onChange={(e) => updateField("emergencyContact", e.target.value)}
            className="input"
            placeholder="Name — phone number"
          />
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
