import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateToken, hashToken, tokenExpiry } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { findAdminByEmail, setAdminResetToken } from "@/lib/admin-queries";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  const OK = NextResponse.json({
    ok: true,
    message: "If that email is registered, a reset link has been sent.",
  });

  if (!email?.trim()) return OK;

  const admin = await findAdminByEmail(email.trim());
  if (!admin || !admin.isVerified) return OK;

  const rawToken = generateToken();
  await setAdminResetToken(admin.id, hashToken(rawToken), tokenExpiry(1));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendPasswordResetEmail(admin.email!, admin.username, `${appUrl}/admin/reset-password?token=${rawToken}`);

  return OK;
}

