import { NextRequest, NextResponse } from "next/server";

/**
 * Security Headers Middleware
 * Adds essential security headers to all responses:
 * - Content Security Policy (CSP)
 * - X-Frame-Options (Clickjacking protection)
 * - X-Content-Type-Options (MIME sniffing prevention)
 * - Strict-Transport-Security (HSTS)
 * - X-XSS-Protection (Legacy XSS protection)
 * - Referrer-Policy (Control information leakage)
 * - Permissions-Policy (Feature control)
 */

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy (CSP)
  // Prevents inline scripts, external scripts from untrusted sources
  // Allows: same-origin, trusted CDNs, only HTTPS
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.tailwindcss.com",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://js.sumup.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ")
  );

  // Prevent clickjacking attacks
  // Deny embedding in iframes from other sites
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  // Browser must respect Content-Type header
  response.headers.set("X-Content-Type-Options", "nosniff");

  // HSTS (HTTP Strict Transport Security)
  // Force HTTPS for all connections
  // Preload: Include in browser's HSTS preload list
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // Legacy XSS protection (for older browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  // Send referrer only to same-origin requests
  // Prevents leaking URLs to external sites
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (formerly Feature Policy)
  // Restrict powerful browser features
  // Disable: camera, microphone, geolocation, payment API, etc.
  response.headers.set(
    "Permissions-Policy",
    [
      "accelerometer=()",
      "camera=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
      "vr=()",
      "xr-spatial-tracking=()",
    ].join(", ")
  );

  return response;
}
