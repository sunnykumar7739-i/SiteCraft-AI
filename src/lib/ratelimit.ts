/**
 * Sliding-window rate limiter. In-memory (per server instance) — swap `store`
 * for Redis/Upstash in multi-instance deployments.
 */
export class RateLimitError extends Error {
  status = 429;
  retryAfter: number;
  constructor(retryAfter: number) {
    super(`Too many requests. Try again in ${retryAfter}s.`);
    this.retryAfter = retryAfter;
  }
}

type Bucket = number[]; // timestamps (ms)
const g = globalThis as unknown as { __sitecraftRl?: Map<string, Bucket> };
const store: Map<string, Bucket> = (g.__sitecraftRl ??= new Map<string, Bucket>());

export const LIMITS = {
  generate: { max: 20, windowMs: 10 * 60_000 }, // 20 generations / 10 min
  edit: { max: 40, windowMs: 10 * 60_000 },
  scrape: { max: 30, windowMs: 10 * 60_000 },
  projects: { max: 60, windowMs: 10 * 60_000 },
  auth: { max: 20, windowMs: 10 * 60_000 },
  billing: { max: 10, windowMs: 10 * 60_000 },
} as const;

export function rateLimit(key: string, limit: { max: number; windowMs: number }) {
  const now = Date.now();
  const bucket = (store.get(key) ?? []).filter((t) => now - t < limit.windowMs);
  if (bucket.length >= limit.max) {
    const retryAfter = Math.ceil((bucket[0] + limit.windowMs - now) / 1000);
    store.set(key, bucket);
    throw new RateLimitError(retryAfter);
  }
  bucket.push(now);
  store.set(key, bucket);
  // opportunistic cleanup
  if (store.size > 10_000) for (const [k, b] of store) if (b.every((t) => now - t > limit.windowMs)) store.delete(k);
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}
