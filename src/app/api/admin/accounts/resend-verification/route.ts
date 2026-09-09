import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";
import { generateToken, hashToken, tokenExpiry } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { findAdminById, refreshAdminVerificationToken } from "@/lib/admin-queries";

export async function POST(req: NextRequest) {
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookieToken || !(await verifyAdminToken(cookieToken))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  const admin = await findAdminById(id);

  if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  if (admin.isVerified) return NextResponse.json({ error: "Account already verified" }, { status: 400 });
  if (!admin.email) return NextResponse.json({ error: "No email on this account" }, { status: 400 });

  const rawToken = generateToken();
  await refreshAdminVerificationToken(admin.id, hashToken(rawToken), tokenExpiry(24));

  // Send token via email body (not in URL to prevent exposure in browser history/logs)
  await sendVerificationEmail(admin.email, admin.username, rawToken);

  return NextResponse.json({ ok: true });
}

