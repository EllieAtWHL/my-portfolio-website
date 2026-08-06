import { NextResponse } from 'next/server';

// Best-effort, in-memory, per-instance rate limiting. This app has no Redis/KV
// infra, and adding one just for this would be overkill for a solo-maintained
// site (see CLAUDE.md's non-goals) - a fixed-window counter that resets on cold
// start still meaningfully caps abuse within a warm instance, especially paired
// with the response caching (see src/lib/data/cache-utils.ts) that already
// absorbs the bulk of repeat-request cost for the routes this guards.
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export interface RateLimitOptions {
  /** Identifies the route/bucket being limited, e.g. 'spurs-women-news'. */
  routeKey: string;
  limit: number;
  windowSeconds: number;
}

/** Returns a 429 NextResponse if the request should be blocked, otherwise null. */
export function rateLimitResponse(request: Request, options: RateLimitOptions): NextResponse | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(`${options.routeKey}:${ip}`, options.limit, options.windowSeconds);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
    );
  }

  return null;
}
