import crypto from "crypto";

/** Generates a 64-char hex token (cryptographically random) */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** SHA-256 hash of a token — stored in DB, raw token goes in email */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Returns a Date N hours from now */
export function tokenExpiry(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/** Returns true if a token expiry date is still in the future */
export function isTokenValid(expiry: Date | null): boolean {
  if (!expiry) return false;
  return expiry > new Date();
}
