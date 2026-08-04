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