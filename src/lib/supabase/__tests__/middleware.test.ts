import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { updateSession } from '../middleware';

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

const mockCreateServerClient = createServerClient as jest.Mock;

// A minimal stand-in for NextRequest that exposes exactly what
// updateSession() reads from it: `.nextUrl` (with `.pathname` and a
// `.clone()` that itself supports mutating `.pathname`) and
// `.cookies.getAll()`. Constructing a real NextRequest under Jest's jsdom
// environment throws ("Cannot set property url of #<NextRequest>") because
// of a conflict between whatwg-fetch's Request polyfill and Next's
// NextRequest class, so a real instance isn't usable here.
//
// FakeNextURL extends the real, built-in URL class so that
// NextResponse.redirect(url) - which internally does
// `String(new URL(String(url)))` - works against it exactly as it would
// against a real NextURL.
class FakeNextURL extends URL {
  clone() {
    return new FakeNextURL(this.toString());
  }
}

function makeRequest(
  pathname: string,
  options: { method?: string; origin?: string | null } = {}
): NextRequest {
  const { method = 'GET', origin } = options;
  const headerEntries: [string, string][] = origin != null ? [['origin', origin]] : [];
  return {
    nextUrl: new FakeNextURL(`http://localhost${pathname}`),
    cookies: { getAll: () => [] },
    method,
    headers: new Headers(headerEntries),
  } as unknown as NextRequest;
}

function mockUser(user: { email: string } | null) {
  mockCreateServerClient.mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
  });
}

describe('updateSession', () => {
  const ORIGINAL_ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  beforeEach(() => {
    mockCreateServerClient.mockReset();
  });

  afterEach(() => {
    if (ORIGINAL_ADMIN_EMAIL === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = ORIGINAL_ADMIN_EMAIL;
    }
  });

  it('(a) redirects an unauthenticated user away from an admin route to /spurs-women/login', async () => {
    mockUser(null);
    const request = makeRequest('/spurs-women/admin');

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/spurs-women/login');
  });

  it('(b) redirects an authenticated user whose email does not match ADMIN_EMAIL to /spurs-women/unauthorised', async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    mockUser({ email: 'someone-else@example.com' });
    const request = makeRequest('/spurs-women/admin');

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/spurs-women/unauthorised');
  });

  it('(c) passes an authenticated user matching ADMIN_EMAIL through to the admin route with no redirect', async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    mockUser({ email: 'admin@example.com' });
    const request = makeRequest('/spurs-women/admin');

    const response = await updateSession(request);

    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('(b-edge) treats a missing ADMIN_EMAIL env var as unauthorised for any authenticated user on an admin route', async () => {
    delete process.env.ADMIN_EMAIL;
    mockUser({ email: 'admin@example.com' });
    const request = makeRequest('/spurs-women/admin');

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/spurs-women/unauthorised');
  });

  it('(b-edge2) blocks a user with no email when ADMIN_EMAIL is also unset (undefined must never equal undefined here)', async () => {
    delete process.env.ADMIN_EMAIL;
    // A defensive edge case: an authenticated Supabase user technically
    // could have a null/undefined email. Without the explicit `!adminEmail`
    // short-circuit, `user.email !== adminEmail` would be
    // `undefined !== undefined` -> false, which would incorrectly let this
    // request through to the admin route.
    mockUser({ email: undefined } as unknown as { email: string });
    const request = makeRequest('/spurs-women/admin');

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/spurs-women/unauthorised');
  });

  it('(d) redirects an unauthenticated user away from a profile route to /spurs-women/login', async () => {
    mockUser(null);
    const request = makeRequest('/spurs-women/profile');

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/spurs-women/login');
  });

  it('(e) passes an authenticated user through to a profile route regardless of their email', async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    mockUser({ email: 'not-the-admin@example.com' });
    const request = makeRequest('/spurs-women/profile');

    const response = await updateSession(request);

    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('(f) leaves an unrelated route completely untouched, with no redirect, even for an unauthenticated user', async () => {
    mockUser(null);
    const request = makeRequest('/spurs-women/matches');

    const response = await updateSession(request);

    expect(response.headers.get('location')).toBeNull();
    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('admin route redirect for a wrong-email user takes precedence over the "no admin email configured" case only when ADMIN_EMAIL IS set and does not match', async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    mockUser({ email: 'admin@example.com' });
    // Sanity: a nested admin path is still matched via startsWith.
    const request = makeRequest('/spurs-women/admin/matches/123');

    const response = await updateSession(request);

    expect(response.headers.get('location')).toBeNull();
  });

  it('a profile route is not accidentally treated as an admin route (no email check applied)', async () => {
    delete process.env.ADMIN_EMAIL;
    mockUser({ email: 'anyone@example.com' });
    const request = makeRequest('/spurs-women/profile/settings');

    const response = await updateSession(request);

    expect(response.headers.get('location')).toBeNull();
  });

  describe('/api/admin/* routes', () => {
    // Body content on these NextResponse.json(...) responses isn't asserted:
    // whatwg-fetch's Response polyfill (used for jsdom in this Jest env) has no
    // `.body` stream getter, which NextResponse.json's `new NextResponse(response.body, response)`
    // relies on - so the body is silently empty here even though it's populated
    // at runtime. Status codes (set via `init`, not the body stream) are unaffected
    // and are what's actually verified below. See jest.setup.js's Response.json polyfill comment.
    it('returns 401 (not a redirect) for an unauthenticated request', async () => {
      mockUser(null);
      const request = makeRequest('/api/admin/matches');

      const response = await updateSession(request);

      expect(response.status).toBe(401);
      expect(response.headers.get('location')).toBeNull();
    });

    it('returns 403 for an authenticated user who is not ADMIN_EMAIL', async () => {
      process.env.ADMIN_EMAIL = 'admin@example.com';
      mockUser({ email: 'someone-else@example.com' });
      const request = makeRequest('/api/admin/matches');

      const response = await updateSession(request);

      expect(response.status).toBe(403);
      expect(response.headers.get('location')).toBeNull();
    });

    it('treats a missing ADMIN_EMAIL env var as forbidden for any authenticated user', async () => {
      delete process.env.ADMIN_EMAIL;
      mockUser({ email: 'admin@example.com' });
      const request = makeRequest('/api/admin/matches');

      const response = await updateSession(request);

      expect(response.status).toBe(403);
    });

    it('lets a GET from the correct admin through with no Origin header required', async () => {
      process.env.ADMIN_EMAIL = 'admin@example.com';
      mockUser({ email: 'admin@example.com' });
      const request = makeRequest('/api/admin/matches', { method: 'GET' });

      const response = await updateSession(request);

      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('lets a same-origin POST from the correct admin through', async () => {
      process.env.ADMIN_EMAIL = 'admin@example.com';
      mockUser({ email: 'admin@example.com' });
      const request = makeRequest('/api/admin/matches', {
        method: 'POST',
        origin: 'http://localhost',
      });

      const response = await updateSession(request);

      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('rejects a POST with no Origin header as a CSRF guard, even from the correct admin', async () => {
      process.env.ADMIN_EMAIL = 'admin@example.com';
      mockUser({ email: 'admin@example.com' });
      const request = makeRequest('/api/admin/matches', { method: 'POST' });

      const response = await updateSession(request);

      expect(response.status).toBe(403);
    });

    it('rejects a POST whose Origin does not match the request origin (cross-site forgery attempt)', async () => {
      process.env.ADMIN_EMAIL = 'admin@example.com';
      mockUser({ email: 'admin@example.com' });
      const request = makeRequest('/api/admin/matches', {
        method: 'POST',
        origin: 'https://evil.example.com',
      });

      const response = await updateSession(request);

      expect(response.status).toBe(403);
    });

    it.each(['PUT', 'DELETE', 'PATCH'])(
      'applies the same Origin check to %s as it does to POST',
      async (method) => {
        process.env.ADMIN_EMAIL = 'admin@example.com';
        mockUser({ email: 'admin@example.com' });
        const request = makeRequest('/api/admin/matches', { method });

        const response = await updateSession(request);

        expect(response.status).toBe(403);
      }
    );
  });
});
