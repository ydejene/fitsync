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

  
}
