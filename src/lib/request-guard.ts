/**
 * Legacy In-Memory Rate Limiting
 * 
 * DEPRECATED: For new endpoints, use the Redis-based rate limiter in rate-limit-redis.ts
 * This implementation is kept for backward compatibility but:
 * - Lost on server restart/redeploy
 * - Only works on single instance (no load balancing)
 * - Can be bypassed by distributed attackers
 * 
 * Phase 2 Security Upgrade (2026-09-09):
 * Migrating critical endpoints to Redis-based rate limiting for:
 * - Persistence across deployments
 * - Distributed rate limiting across multiple instances
 * - Better protection against coordinated attacks
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function getRequestFingerprint(req: Request, scope: string) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const host = req.headers.get("host")?.trim() ?? "local";
  const agent = req.headers.get("user-agent")?.trim() ?? "unknown";
  return [scope, forwardedFor || realIp || host, agent].join("|");
}

export function isRateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  if (current.count > limit) {
    return true;
  }

  return false;
}