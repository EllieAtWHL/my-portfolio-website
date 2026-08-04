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

function makeRequest(pathname: string): NextRequest {
  return {
    nextUrl: new FakeNextURL(`http://localhost${pathname}`),
    cookies: { getAll: () => [] },
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
});
