import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens to prevent cross-site request forgery attacks
 */

const CSRF_TOKEN_LENGTH = 32; // 256 bits
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_COOKIE_NAME = "csrf-token";

interface CSRFTokenData {
  token: string;
  createdAt: number;
}

// In-memory store for CSRF tokens (in production, use Redis)
// Key: sessionId or userId, Value: token data
const csrfStore = new Map<string, CSRFTokenData>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of csrfStore.entries()) {
    if (now - data.createdAt > CSRF_TOKEN_EXPIRY) {
      csrfStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Every hour

/**
 * Generate a new CSRF token for a session/user
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Store CSRF token for a session
 * In production, this should use Redis or a database
 */
function storeCSRFToken(sessionId: string, token: string): void {
  csrfStore.set(sessionId, {
    token,
    createdAt: Date.now(),
  });
}

/**
 * Retrieve and validate CSRF token
 */
function getCSRFToken(sessionId: string): string | null {
  const data = csrfStore.get(sessionId);
  if (!data) return null;

  // Check if token has expired
  if (Date.now() - data.createdAt > CSRF_TOKEN_EXPIRY) {
    csrfStore.delete(sessionId);
    return null;
  }

  return data.token;
}

/**
 * Validate CSRF token from request
 * Returns true if valid, false otherwise
 */
export function validateCSRFToken(
  sessionId: string,
  incomingToken: string
): boolean {
  const storedToken = getCSRFToken(sessionId);
  if (!storedToken) return false;

  // Use constant-time comparison to prevent timing attacks
  return constantTimeCompare(storedToken, incomingToken);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * CSRF Middleware for validating tokens on state-changing requests
 * Apply to: POST, PUT, PATCH, DELETE endpoints
 */
export async function validateCSRFMiddleware(
  req: NextRequest
): Promise<NextResponse | null> {
  // Only validate for state-changing methods
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return null;
  }

  // Exempted endpoints (webhooks, public APIs, health checks)
  const exemptedPaths = [
    "/api/payments/webhook/", // Webhook endpoints
    "/api/sumup/oauth/", // OAuth callbacks
    "/api/analytics", // Analytics (public)
    "/api/contact", // Public contact form (but we should still protect it)
  ];

  const pathname = req.nextUrl.pathname;
  const isExempted = exemptedPaths.some((path) => pathname.startsWith(path));

  if (isExempted && !pathname.includes("/admin/")) {
    // Allow public endpoints and webhooks without CSRF (except admin)
    return null;
  }

  // Get CSRF token from headers
  const incomingToken = req.headers.get(CSRF_HEADER_NAME);
  if (!incomingToken) {
    console.warn(
      `[CSRF] Missing token in ${method} ${pathname}`
    );
    return NextResponse.json(
      { error: "CSRF token required" },
      { status: 403 }
    );
  }

  // Get session ID from cookie or header
  const sessionId = req.cookies.get("sessionId")?.value;
  if (!sessionId) {
    console.warn(`[CSRF] Missing session in ${method} ${pathname}`);
    return NextResponse.json(
      { error: "Session required" },
      { status: 401 }
    );
  }

  // Validate token
  if (!validateCSRFToken(sessionId, incomingToken)) {
    console.warn(
      `[CSRF] Invalid token in ${method} ${pathname}`
    );
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Generate new CSRF token and return it to client
 * Call this on page load (GET requests)
 */
export function generateAndStoreCSRFToken(sessionId: string): string {
  const token = generateCSRFToken();
  storeCSRFToken(sessionId, token);
  return token;
}

/**
 * Helper to add CSRF token to response headers
 */
export function withCSRFToken(
  response: NextResponse,
  token: string
): NextResponse {
  response.headers.set("X-CSRF-Token", token);
  return response;
}
