/**
 * Simple custom admin session using signed JWT (no NextAuth dependency).
 * Uses jose which is already available (installed by next-auth).
 */
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "admin_token";

function getAdminSecret() {
  const secret = process.env.NEXTAUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for admin authentication");
  }

  return new TextEncoder().encode(secret);
}

export async function createAdminToken(userId: string, username: string) {
  return new SignJWT({ userId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(getAdminSecret());
}

export async function verifyAdminToken(
  token: string
): Promise<{ userId: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getAdminSecret());
    return payload as { userId: string; username: string };
  } catch {
    return null;
  }
}
