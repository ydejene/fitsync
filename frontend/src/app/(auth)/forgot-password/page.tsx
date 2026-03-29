"use client";

import { useState } from "react";
import Link from "next/link";
import { isValidEmail } from "@/utils/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-6 hover:opacity-85 transition-opacity">
            <img src="/logo.png" alt="FitSync Logo" className="h-10 md:h-12 w-auto object-contain" />
          </Link>
          <h1 className="font-display text-3xl font-bold text-text-primary">Reset Password</h1>
          <p className="text-sm text-text-secondary mt-1">
            {submitted ? "Check your inbox" : "Enter your email to get a reset link"}
          </p>
        </div>

        <div className="card p-8">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1.5">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  required
                />
              </div>

              {error && (
                <div role="alert" className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <i className="fa-solid fa-circle-exclamation text-red-500 text-sm" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
                {loading ? (
                  <><i className="fa-solid fa-spinner fa-spin text-xs" /> Sending...</>
                ) : (
                  <><i className="fa-solid fa-paper-plane text-xs" /> Send Reset Link</>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <i className="fa-solid fa-envelope-circle-check text-2xl text-green-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-text-primary font-medium">
                  We&apos;ve sent a password reset link to:
                </p>
                <p className="text-sm font-bold text-brand-orange">{email}</p>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                If you don&apos;t see it in a few minutes, check your spam folder or try again.
              </p>
              <Link href="/login" className="btn-secondary w-full justify-center py-3 block text-center">
                Back to Login
              </Link>
            </div>
          )}
        </div>

        {!submitted && (
          <>
            <p className="text-center text-xs text-text-muted mt-8">
              Need help? <a href="https://t.me/Niyoll" target="_blank" rel="noopener noreferrer" className="text-brand-orange font-medium hover:underline">Contact Support</a>
            </p>
            <p className="text-center text-xs text-text-muted mt-2">
              FitSync — Gym Management Platform for Addis Ababa
            </p>
            <p className="text-center text-sm text-text-secondary mt-6">
              Remembered your password?{" "}
              <Link href="/login" className="text-brand-orange font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
