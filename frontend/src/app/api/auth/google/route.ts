import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  console.log("[google] handler start, BACKEND_URL=", BACKEND_URL);
  try {
    const body = await req.json();
    console.log("[google] body parsed, idToken present:", !!body.idToken);

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log("[google] backend responded:", backendRes.status);

    const contentType = backendRes.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.error("[google] backend returned non-JSON:", backendRes.status, await backendRes.text());
      return NextResponse.json(
        { success: false, message: "Backend unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      console.log("[google] backend error:", data.message);
      return NextResponse.json(data, { status: backendRes.status });
    }

    const user = data.data.user;
    console.log("[google] signing token for user:", user?.id);
    const token = await signToken(user);

    const response = NextResponse.json(data);
    response.cookies.set("fitsync_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    console.log("[google] success, cookie set");
    return response;
  } catch (err) {
    console.error("[google] proxy error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
