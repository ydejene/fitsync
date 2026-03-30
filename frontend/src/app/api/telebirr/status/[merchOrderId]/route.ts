import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ merchOrderId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fitsync_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized – please log in" },
        { status: 401 }
      );
    }

    const { merchOrderId } = await params;

    const backendRes = await fetch(
      `${BACKEND_URL}/api/telebirr/status/${merchOrderId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("Telebirr status proxy error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
