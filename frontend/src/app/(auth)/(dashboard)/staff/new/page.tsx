"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clientFetch } from "@/lib/api";

export default function AddStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.fullName || !form.email || !form.password) {
      setError("Full name, email and password are required.");
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
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
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

      <div className="card max-w-2xl">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            <i className="fa-solid fa-circle-exclamation" />
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

        <div className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="label">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="input"
              placeholder="e.g. Abebe Girma"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="staff@fitsync.et"
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input
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
              <label className="label">Password *</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input"
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <label className="label">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder="Repeat password"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
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
        </div>
      </div>
    </div>
  );
}