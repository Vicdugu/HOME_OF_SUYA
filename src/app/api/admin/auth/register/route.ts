import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";
import { generateToken, hashToken, tokenExpiry } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import {
  adminUsernameOrEmailExists,
  createAdminUser,
} from "@/lib/admin-queries";

export async function POST(req: NextRequest) {
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookieToken || !(await verifyAdminToken(cookieToken))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username, email } = await req.json();

  if (!username?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Username and email are required" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (await adminUsernameOrEmailExists(username.trim(), email.trim())) {
    return NextResponse.json({ error: "Username or email already in use" }, { status: 409 });
  }

  const rawToken = generateToken();
  const hashedToken = hashToken(rawToken);
  const expiry = tokenExpiry(24);

  const newAdmin = await createAdminUser({
    username: username.trim(),
    email: email.trim(),
    verificationToken: hashedToken,
    verificationTokenExpiry: expiry,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendVerificationEmail(email.trim(), username.trim(), `${appUrl}/admin/verify?token=${rawToken}`);

  return NextResponse.json({ ok: true, id: newAdmin.id }, { status: 201 });
}

