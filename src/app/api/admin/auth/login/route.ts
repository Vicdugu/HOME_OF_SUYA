import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminToken, COOKIE_NAME } from "@/lib/admin-auth";
import { findAdminByLogin } from "@/lib/admin-queries";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const login = typeof username === "string" ? username.trim() : "";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const requestProtocol = forwardedProto ?? new URL(req.url).protocol.replace(":", "");
  const shouldUseSecureCookie = requestProtocol === "https";

  if (!login || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const user = await findAdminByLogin(login);

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.status === "DISABLED") {
    return NextResponse.json({ error: "Account is disabled" }, { status: 403 });
  }

  // isVerified === false (strict) — undefined means pre-migration admin, treat as verified
  if (user.isVerified === false) {
    return NextResponse.json(
      { error: "Account not verified. Check your email to activate your account." },
      { status: 403 }
    );
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createAdminToken(user.id, user.username);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: shouldUseSecureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}

