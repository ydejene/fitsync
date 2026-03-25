"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clientFetch } from "@/lib/api";
import { getRequiredFieldMessage, isValidEmail } from "@/utils/validation";

type StaffForm = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export default function AddStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof StaffForm, string>>>({});

  const [form, setForm] = useState<StaffForm>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof StaffForm;
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (error) setError("");
  };

  function validateForm() {
    const nextErrors: Partial<Record<keyof StaffForm, string>> = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = getRequiredFieldMessage("Full name");
    }
    if (!form.email.trim()) {
      nextErrors.email = getRequiredFieldMessage("Email address");
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!form.password.trim()) {
      nextErrors.password = getRequiredFieldMessage("Password");
    }
    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = getRequiredFieldMessage("Confirm password");
    }

    return nextErrors;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const nextErrors = validateForm();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError(Object.values(nextErrors)[0] || "Please review the highlighted fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const data = await clientFetch("/api/staff", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });
      if (!data.success) throw new Error(data.message);
      router.push("/staff");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create staff.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Staff Member</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new staff account
          </p>
        </div>
        <Link href="/staff" className="btn-secondary">
          <i className="fa-solid fa-arrow-left" />
          Back to Staff
        </Link>
      </div>

      <div className="card max-w-2xl p-6">
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm"
          >
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Info banner */}
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-blue-700 text-sm">
          <i className="fa-solid fa-circle-info mt-0.5" />
          <div>
            <p className="font-semibold">Staff Access</p>
            <p className="mt-0.5 text-blue-600">
              Staff accounts have limited access by default. After creating the
              account, go to the staff permissions page to enable specific
              features.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Full Name */}
          <div>
            <label htmlFor="staff-full-name" className="label">Full Name *</label>
              <input
                id="staff-full-name"
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="input"
                placeholder="e.g. Abebe Girma"
                required
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={fieldErrors.fullName ? "staff-full-name-error" : undefined}
              />
              {fieldErrors.fullName && (
                <p id="staff-full-name-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="staff-email" className="label">Email Address *</label>
              <input
                id="staff-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="staff@fitsync.et"
                required
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "staff-email-error" : undefined}
              />
              {fieldErrors.email && (
                <p id="staff-email-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="staff-phone" className="label">
                Phone Number
                <span className="ml-1 text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="staff-phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="input"
                placeholder="+251 9XX XXX XXX"
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="staff-password" className="label">Password *</label>
              <input
                id="staff-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input"
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "staff-password-error" : undefined}
              />
              {fieldErrors.password && (
                <p id="staff-password-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="staff-confirm-password" className="label">Confirm Password *</label>
              <input
                id="staff-confirm-password"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder="Repeat password"
                required
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? "staff-confirm-password-error" : undefined}
              />
              {fieldErrors.confirmPassword && (
                <p id="staff-confirm-password-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-user-plus" />
                  Create Staff Account
                </>
              )}
            </button>
            <Link href="/staff" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
