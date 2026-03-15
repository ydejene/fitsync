"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Use an environment variable or a constant for the backend URL
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Point to the Express URL
      // 2. Add 'credentials: "include"' to allow the backend to set cookies
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include", 
      });
      
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials");
        return;
      }

      // Success! Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-dumbbell text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-text-primary">FitSync</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-text-primary">Welcome back</h1>
          <p className="text-sm text-text-secondary mt-1">Sign in to your account</p>
        </div>

        {/* Card Component from your globals.css */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1.5">
                Email address
              </label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="input"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <i className="fa-solid fa-circle-exclamation text-red-500 text-sm" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? (
                <><i className="fa-solid fa-spinner fa-spin text-xs" /> Signing in...</>
              ) : (
                <><i className="fa-solid fa-arrow-right-to-bracket text-xs" /> Sign In</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          FitSync — Gym Management Platform for Addis Ababa
        </p>
      </div>
    </div>
  );
}