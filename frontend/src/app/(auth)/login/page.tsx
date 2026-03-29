"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import { getRequiredFieldMessage, isValidEmail } from "@/utils/validation";

interface GoogleCredentialResponse {
  credential?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const nextFieldErrors: { email?: string; password?: string } = {};

    if (!form.email.trim()) {
      nextFieldErrors.email = getRequiredFieldMessage("Email address");
    } else if (!isValidEmail(form.email)) {
      nextFieldErrors.email = "Please enter a valid email address.";
    }
    if (!form.password.trim()) {
      nextFieldErrors.password = getRequiredFieldMessage("Password");
    }

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      setError(Object.values(nextFieldErrors)[0] || "Please review the highlighted fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      router.push("/insights");
    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
      console.error("Login Error:", err);
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse: GoogleCredentialResponse) {
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
        setError(data.message || "Google authentication failed");
        setLoading(false);
        return;
      }

      router.push("/insights");
    } catch (err) {
      setError("Failed to login with Google");
      console.error(err);
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
          <h1 className="font-display text-3xl font-bold text-text-primary">Welcome back</h1>
          <p className="text-sm text-text-secondary mt-1">Sign in to your account</p>
        </div>

        {/* Card Component */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  if (error) setError("");
                }}
                required
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
              />
              {fieldErrors.email && (
                <p id="login-email-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1.5">
                Password
              </label>
              <div className="relative group">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="input pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    if (error) setError("");
                  }}
                  required
                  autoComplete="current-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-orange transition-colors duration-200 cursor-pointer p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <Link href="/forgot-password" title="Get a password reset link" className="text-xs font-medium text-brand-orange hover:underline">
                  Forgot password?
                </Link>
              </div>
              {fieldErrors.password && (
                <p id="login-password-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg"
              >
                <i className="fa-solid fa-circle-exclamation text-red-500 text-sm" aria-hidden="true" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-3 cursor-pointer" disabled={loading}>
              {loading ? (
                <><i className="fa-solid fa-spinner fa-spin text-xs" /> Signing in...</>
              ) : (
                <><i className="fa-solid fa-arrow-right-to-bracket text-xs" /> Sign In</>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-light-gray" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-text-muted">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google login failed")}
                  theme="outline"
                  shape="circle"
                  width="320px"
                />
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-orange font-semibold hover:underline">
            Create Account
          </Link>
        </p>
        <p className="text-center text-xs text-text-muted mt-8">
          Need help? <a href="https://t.me/Niyoll" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline font-medium">Contact Support</a>
        </p>
        <p className="text-center text-xs text-text-muted mt-2">
          FitSync — Gym Management Platform for Addis Ababa
        </p>
      </div>
    </div>
  );
}
