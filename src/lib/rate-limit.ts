// Simple in-memory sliding-window rate limiter for Edge Middleware.
//
// LIMITATION: state is per isolate/instance, so on a multi-region or
// multi-instance edge deployment this is only a best-effort mitigation.
// For a hard guarantee, back this with a shared store (e.g. Upstash Redis)
// as noted in FRD 4.5 ("Abuse Mitigation").

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((windowMs - (now - oldest)) / 1000),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.timestamps.length, retryAfterSeconds: 0 };
}
