import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = backendRes.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.error("[login] backend returned non-JSON:", backendRes.status, await backendRes.text());
      return NextResponse.json(
        { success: false, message: "Backend unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const user = data.data.user;
    const token = await signToken(user);

    const response = NextResponse.json(data);
    response.cookies.set("fitsync_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login proxy error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
