"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing. Please request a new link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <i className="fa-solid fa-circle-check text-2xl text-green-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-text-primary">Password Reset Successful!</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Your password has been updated. You will be redirected to the login page in a few seconds.
          </p>
        </div>
        <Link href="/login" className="btn-primary w-full justify-center py-3 block text-center">
          Login Now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!token && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg mb-4">
          <i className="fa-solid fa-circle-exclamation text-red-500 text-sm" />
          <span className="text-sm text-red-600">Reset token is missing or invalid.</span>
        </div>
      )}

      <div>
        <label htmlFor="reset-password" title="Set your new password" className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1.5">
          New Password
        </label>
        <div className="relative group">
          <input
            id="reset-password"
            type={showPassword ? "text" : "password"}
            className="input pr-10"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            required
            minLength={8}
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
        <p className="text-[10px] text-text-muted mt-1.5">
          Must contain at least 8 characters, including letters and numbers.
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
          <i className="fa-solid fa-circle-exclamation text-red-500 text-sm" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      <button
        type="submit"
        className="btn-primary w-full justify-center py-3"
        disabled={loading || !token}
      >
        {loading ? (
          <><i className="fa-solid fa-spinner fa-spin text-xs" /> Updating Password...</>
        ) : (
          <><i className="fa-solid fa-key text-xs" /> Set New Password</>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-6 hover:opacity-85 transition-opacity">
            <img src="/logo.png" alt="FitSync Logo" className="h-10 md:h-12 w-auto object-contain" />
          </Link>
          <h1 className="font-display text-3xl font-bold text-text-primary">Create New Password</h1>
          <p className="text-sm text-text-secondary mt-1">
            Choose a secure password for your account
          </p>
        </div>

        <div className="card p-8">
          <Suspense fallback={<div className="text-center py-8"><i className="fa-solid fa-spinner fa-spin text-brand-orange" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-text-muted mt-8">
          Need help? <a href="https://t.me/Niyoll" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}
