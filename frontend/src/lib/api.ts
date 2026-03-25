// src/lib/api.ts
// Client-side fetch helper — safe to import from "use client" components

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

/**
 * Client-side fetch — sends credentials: "include" so the browser
 * attaches the httpOnly cookie automatically.
 * Use this in "use client" components.
 */
export function clientFetch<T = any>(
  path: string,
  init?: RequestInit
): Promise<{ success: boolean; data: T; message?: string }> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  }).then((res) => res.json());
}

export { API_BASE };
