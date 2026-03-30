import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
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

    const { path } = await params;
    const url = new URL(req.url);
    const backendUrl = `${BACKEND_URL}/${path.join("/")}${url.search}`;

    const contentType = req.headers.get("content-type") || "";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    let body: BodyInit | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (contentType.includes("multipart/form-data")) {
        body = await req.formData();
        // Do NOT set Content-Type — fetch sets it automatically with boundary
      } else {
        body = await req.text();
        headers["Content-Type"] = contentType || "application/json";
      }
    }

    const backendRes = await fetch(backendUrl, {
      method: req.method,
      headers,
      body,
    });

    const resContentType = backendRes.headers.get("content-type") || "";
    if (resContentType.includes("application/json")) {
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    }

    const text = await backendRes.text();
    return new NextResponse(text, {
      status: backendRes.status,
      headers: { "Content-Type": resContentType },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
