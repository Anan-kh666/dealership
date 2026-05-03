/**
 * Tiny in-memory fixed-window rate limiter. Suitable for single-process v1
 * deployments; replace with a Redis-backed counter when REDIS_URL is wired
 * up. Keys are scoped per limiter so the same client IP can have separate
 * budgets for different endpoints.
 */
type Bucket = { count: number; resetAt: number };

export interface RateLimiter {
  check(key: string): { ok: true } | { ok: false; retryAfter: number };
}

export function createRateLimiter(opts: {
  max: number;
  windowMs: number;
}): RateLimiter {
  const buckets = new Map<string, Bucket>();
  return {
    check(key) {
      const now = Date.now();
      const b = buckets.get(key);
      if (!b || b.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
        if (buckets.size > 5000) {
          for (const [k, v] of buckets) {
            if (v.resetAt <= now) buckets.delete(k);
          }
        }
        return { ok: true };
      }
      if (b.count >= opts.max) {
        return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
      }
      b.count += 1;
      return { ok: true };
    },
  };
}
