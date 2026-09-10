import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ valid: false, error: "No session token found" }, { status: 401 });
    }

    const payload = await verifyAdminToken(token);

    if (!payload) {
      return NextResponse.json({ valid: false, error: "Session token is invalid or expired" }, { status: 401 });
    }

    return NextResponse.json({ valid: true, userId: payload.userId, username: payload.username });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json({ valid: false, error: "Session verification failed" }, { status: 500 });
  }
}
