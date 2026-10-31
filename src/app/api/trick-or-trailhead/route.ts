import { NextRequest, NextResponse } from 'next/server';
import { rateLimitResponse } from '@/lib/rate-limit';
import { isTrickOrTrailheadEnabled } from '@/lib/trailhead/availability';
import { isTrailheadError, type TrailheadErrorCode } from '@/lib/trailhead/errors';
import { getTrickOrTrailheadResult } from '@/lib/trailhead/lookup';
import { parseTrailheadUsername } from '@/lib/trailhead/username';

// A full EVENT + MODULE scan measured 11.5s from Vercel (WEB-230); this leaves
// room for profiles about twice that size.
export const maxDuration = 30;

// GET /api/trick-or-trailhead?username=<username or profile URL>
// 200: { status: 'found', profile, earned, missing, unmatched, total, incomplete }
// Otherwise { error: <code> }, with the status below. 429 also comes from our
// own per-IP limit, with { error: 'Too many requests' } - both mean "try later".
const ERROR_STATUS: Record<TrailheadErrorCode | 'INVALID_USERNAME', number> = {
  INVALID_USERNAME: 400,
  PRIVATE_PROFILE: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  UPSTREAM_UNAVAILABLE: 502,
  UPSTREAM_CHANGED: 502,
};

function errorResponse(code: keyof typeof ERROR_STATUS) {
  return NextResponse.json({ error: code }, { status: ERROR_STATUS[code] });
}

export async function GET(request: NextRequest) {
  // Off in production until WEB-234: 404 before any rate-limit or Trailhead work.
  if (!isTrickOrTrailheadEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const rateLimited = rateLimitResponse(request, {
    routeKey: 'trick-or-trailhead',
    limit: 10,
    windowSeconds: 60,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const username = parseTrailheadUsername(request.nextUrl.searchParams.get('username') ?? '');
  if (!username) {
    return errorResponse('INVALID_USERNAME');
  }

  try {
    const result = await getTrickOrTrailheadResult(username);
    if (result.status === 'not-found') {
      return errorResponse('NOT_FOUND');
    }
    return NextResponse.json(result);
  } catch (error) {
    if (isTrailheadError(error)) {
      return errorResponse(error.code);
    }
    // Never includes the username: TrailheadError and CacheError messages don't.
    console.error('Error in trick-or-trailhead API route:', error);
    return NextResponse.json({ error: 'Failed to check badges' }, { status: 500 });
  }
}
