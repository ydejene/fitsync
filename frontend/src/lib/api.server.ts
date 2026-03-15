// src/lib/api.server.ts
// Server-side fetch helper — imports "next/headers" (server-only)
// Only import this from Server Components, never from "use client" components.
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

/**
 * Server-side fetch — forwards the fitsync_token cookie to Express.
 * Use this in Server Components and server actions only.
 */
export async function apiFetch<T = any>(
  path: string,
  init?: RequestInit
): Promise<{ success: boolean; data: T; message?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("fitsync_token")?.value;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Cookie: `fitsync_token=${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, data: null as unknown as T, message: body.message || res.statusText };
  }

  return res.json();
}
