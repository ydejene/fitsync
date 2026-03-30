import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fitsync_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized – please log in" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const backendRes = await fetch(`${BACKEND_URL}/api/telebirr/mock-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("Telebirr mock-payment proxy error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
