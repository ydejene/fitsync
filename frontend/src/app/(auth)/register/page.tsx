"use client";

/**
 * Register Page — /register
 * Gym owner signup form. Creates account with OWNER role and 'pending' subscription.
 * On success, redirects to /subscribe for plan selection and payment.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  async function handleGoogleSuccess(credentialResponse: any) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Google registration failed");
        setLoading(false);
        return;
      }

      const user = data.data.user;
      if (user.role === "OWNER" && user.subscriptionStatus !== "active") {
        router.push("/subscribe");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Failed to register with Google");
      console.error(err);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Full Name Validation: At least two words, each at least 2 chars long
    const nameParts = form.fullName.trim().split(/\s+/);
    if (nameParts.length < 2 || nameParts.some(part => part.length < 2)) {
      setError("Please enter a valid full name (first and last name, at least 2 characters each).");
      setLoading(false);
      return;
    }

    // 2. Email Validation: Valid format structure with standard domains
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    // 3. Phone Validation: Exact 9 digits starting with 9 or 7
    const phoneRegex = /^[79]\d{8}$/;
    if (!phoneRegex.test(form.phone)) {
      setError("Please enter a valid 9-digit Ethiopian phone number starting with 9 or 7.");
      setLoading(false);
      return;
    }

    // 4. Password Validation: Strong password rules
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password)) {
      setError("Password must contain at least one letter and one number.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        phone: `+251${form.phone}`
      };

      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Registration failed");
        return;
      }

      // Success — redirect to pricing/subscribe page
      router.push("/subscribe");
    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
      console.error("Register Error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center px-4 font-sans py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-dumbbell text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-text-primary">FitSync</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-text-primary">Get Started</h1>
          <p className="text-sm text-text-secondary mt-1">
            Create your gym management account
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="Birhanu Nega"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className="input"
                placeholder="test@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1.5">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center px-4 bg-gray-50 border border-border-base rounded-lg text-sm text-text-secondary font-medium shrink-0">
                  +251
                </div>
                <input
                  type="tel"
                  className="input flex-1"
                  placeholder="9XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setForm({ ...form, phone: digits });
                  }}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="input"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <i className="fa-solid fa-circle-exclamation text-red-500 text-sm mt-0.5" />
                <span className="text-sm text-red-600 leading-tight">{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? (
                <><i className="fa-solid fa-spinner fa-spin text-xs" /> Creating Account...</>
              ) : (
                <><i className="fa-solid fa-user-plus text-xs" /> Create Account</>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-text-secondary">
              Already have an account?{" "}
              <Link href="/login" className="text-brand-orange font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-light-gray" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-text-muted">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google login failed")}
                theme="outline"
                shape="pill"
                width="280px"
              />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          FitSync — Gym Management Platform for Addis Ababa
        </p>
      </div>
    </div>
  );
}
