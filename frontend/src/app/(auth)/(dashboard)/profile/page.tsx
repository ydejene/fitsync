"use client";

import { useState, useEffect } from "react";
import { clientFetch } from "@/lib/api";
import type { AuthUser, ApiResponse } from "@/types";
import { getInitials } from "@/utils";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await clientFetch<{ user: AuthUser }>("/api/auth/me");
      if (res.success && res.data) {
        setUser(res.data.user);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await clientFetch<any>("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify(user),
      });

      if (res.success) {
        setMessage({ text: "Profile updated successfully!", type: "success" });
        router.refresh();
      } else {
        setMessage({ text: res.message || "Failed to update profile", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Error connecting to server", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="fa-solid fa-spinner fa-spin text-[#F15A24] text-2xl" />
      </div>
    );
  }

}
