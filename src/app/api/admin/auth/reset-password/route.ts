import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { hashToken, isTokenValid } from "@/lib/tokens";
import { findAdminByResetToken, resetAdminPassword } from "@/lib/admin-queries";

export async function POST(req: NextRequest) {
  const { token, password, confirmPassword } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const admin = await findAdminByResetToken(hashToken(token));

  if (!admin) {
    return NextResponse.json({ error: "Invalid or already used reset link" }, { status: 400 });
  }
  if (!isTokenValid(admin.resetTokenExpiry)) {
    return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
  }

  await resetAdminPassword(admin.id, await bcrypt.hash(password, 12));
  return NextResponse.json({ ok: true });
}

