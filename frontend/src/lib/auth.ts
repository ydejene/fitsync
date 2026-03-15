// src/lib/auth.ts

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { AuthUser } from "@/types";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signToken(payload: AuthUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("fitsync_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<AuthUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireAdmin(): Promise<AuthUser> {
  const session = await requireAuth();
  if (session.role !== "ADMIN") throw new Error("FORBIDDEN");
  return session;
}

export async function requireAdminOrStaff(): Promise<AuthUser> {
  const session = await requireAuth();
  if (session.role === "MEMBER") throw new Error("FORBIDDEN");
  return session;
}