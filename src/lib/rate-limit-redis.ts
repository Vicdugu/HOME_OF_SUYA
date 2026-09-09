import { NextRequest, NextResponse } from "next/server";

/**
 * Distributed Rate Limiting using Redis/Upstash
 * Supports load balancing and multiple instances
 * Falls back to in-memory if Redis is unavailable
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
  keyPrefix?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory fallback (when Redis is unavailable)
const inMemoryStore = new Map<string, RateLimitEntry>();

// Try to import Upstash Redis (available in production)
let kv: any = null;

async function initializeRedis() {
  if (kv) return;

  try {
    // Dynamic import to avoid build errors if package isn't available
    const upstash = await import("@upstash/redis");
    if (upstash && upstash.Redis) {
      kv = upstash.Redis.fromEnv();
      console.log("[Rate Limit] Redis initialized");
    }
  } catch {
    console.warn("[Rate Limit] Redis unavailable, using in-memory fallback");
  }
}

/**
 * Get the fingerprint for rate limiting
 * Combines IP, User-Agent, and optional scope
 */
function getFingerprintKey(
  req: NextRequest,
  scope: string = "default"
): string {
  // Get IP address (handle proxies)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const userAgent = req.headers.get("user-agent") || "unknown";

  return `rl:${scope}:${ip}:${userAgent}`;
}

/**
 * Increment rate limit counter using Redis
 * Returns remaining requests, or null if limit exceeded
 */
async function incrementRedisCounter(
  key: string,
  config: RateLimitConfig
): Promise<{ remaining: number; resetTime: number } | null> {
  try {
    if (!kv) {
      await initializeRedis();
    }

    if (!kv) {
      // Fallback to in-memory
      return incrementInMemoryCounter(key, config);
    }

    // Use Redis with TTL
    const current = await kv.incr(key);
    const ttl = await kv.ttl(key);

    if (current === 1) {
      // First request in this window, set expiry
      await kv.expire(key, Math.ceil(config.windowMs / 1000));
    }

    if (current > config.maxRequests) {
      const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : config.windowMs);
      return null; // Limit exceeded
    }

    return {
      remaining: config.maxRequests - current,
      resetTime: Date.now() + (ttl > 0 ? ttl * 1000 : config.windowMs),
    };
  } catch (err) {
    console.error("[Rate Limit] Redis error:", err);
    // Fallback to in-memory
    return incrementInMemoryCounter(key, config);
  }
}

/**
 * Increment in-memory counter (fallback)
 */
function incrementInMemoryCounter(
  key: string,
  config: RateLimitConfig
): { remaining: number; resetTime: number } | null {
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    inMemoryStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Same window
  entry.count++;

  if (entry.count > config.maxRequests) {
    return null; // Limit exceeded
  }

  return {
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit middleware
 * Apply to endpoints that need protection
 */
export async function rateLimitMiddleware(
  req: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const key = getFingerprintKey(req, config.keyPrefix || "default");
  const result = await incrementRedisCounter(key, config);

  if (result === null) {
    // Limit exceeded
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Reset": String(Date.now() + config.windowMs),
        },
      }
    );
  }

  return null; // Within limits, continue processing
}

/**
 * Pre-configured rate limits for different endpoints
 */
export const RateLimits = {
  // Auth attempts
  LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  FORGOT_PASSWORD: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  VERIFY_ACCOUNT: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour

  // Bookings
  CREATE_BOOKING: { maxRequests: 8, windowMs: 10 * 60 * 1000 }, // 8 per 10 min
  CHANGE_REQUEST: { maxRequests: 5, windowMs: 10 * 60 * 1000 }, // 5 per 10 min

  // Uploads
  FILE_UPLOAD: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  MEAL_PHOTO: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour

  // Public forms
  CONTACT_FORM: { maxRequests: 6, windowMs: 10 * 60 * 1000 }, // 6 per 10 min
  CATERING_ENQUIRY: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour

  // API
  ANALYTICS: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
};

/**
 * Clean up expired in-memory entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
