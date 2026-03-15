"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-brand-off-white flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
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

        <div className="card p-8">
          <p className="text-sm text-text-secondary text-center">Login form coming soon...</p>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          FitSync — Gym Management Platform for Addis Ababa
        </p>
      </div>
    </div>
  );
}