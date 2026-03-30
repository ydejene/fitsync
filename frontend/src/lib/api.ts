// src/lib/api.ts
// Client-side fetch helper — safe to import from "use client" components

/**
 * Client-side fetch — routes through the Next.js proxy at /api/proxy
 * so the server-side fitsync_token cookie is forwarded to the backend.
 * Use this in "use client" components.
 */
export function clientFetch<T = any>(
  path: string,
  init?: RequestInit
): Promise<{ success: boolean; data: T; message?: string }> {
  return fetch(`/api/proxy${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  }).then((res) => res.json());
}
