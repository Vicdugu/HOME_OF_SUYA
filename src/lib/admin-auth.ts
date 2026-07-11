/**
 * Simple custom admin session using signed JWT (no NextAuth dependency).
 * Uses jose which is already available (installed by next-auth).
 */
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "fallback-dev-secret"
);
export const COOKIE_NAME = "admin_token";

export async function createAdminToken(userId: string, username: string) {
  return new SignJWT({ userId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(SECRET);
}

export async function verifyAdminToken(
  token: string
): Promise<{ userId: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; username: string };
  } catch {
    return null;
  }
}
