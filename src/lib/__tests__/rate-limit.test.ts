import { checkRateLimit, getClientIp, rateLimitResponse } from '../rate-limit';

function makeRequest(headers: Record<string, string> = {}): Request {
  return { headers: new Headers(headers) } as unknown as Request;
}

describe('checkRateLimit', () => {
  it('allows requests up to the limit within the window', () => {
    const key = 'test-allow-up-to-limit';
    expect(checkRateLimit(key, 3, 60).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60).allowed).toBe(true);
  });

  it('blocks the request once the limit is exceeded, with a positive retryAfterSeconds', () => {
    const key = 'test-block-over-limit';
    checkRateLimit(key, 2, 60);
    checkRateLimit(key, 2, 60);

    const result = checkRateLimit(key, 2, 60);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('resets the count once the window has elapsed', () => {
    const key = 'test-window-reset';
    const dateSpy = jest.spyOn(Date, 'now');
    dateSpy.mockReturnValue(1_000_000);

    checkRateLimit(key, 1, 10);
    expect(checkRateLimit(key, 1, 10).allowed).toBe(false);

    dateSpy.mockReturnValue(1_000_000 + 11_000);
    expect(checkRateLimit(key, 1, 10).allowed).toBe(true);

    dateSpy.mockRestore();
  });

  it('tracks separate keys independently', () => {
    expect(checkRateLimit('test-key-a', 1, 60).allowed).toBe(true);
    expect(checkRateLimit('test-key-b', 1, 60).allowed).toBe(true);
    // key-a is now at its limit; key-b (a different bucket) is unaffected.
    expect(checkRateLimit('test-key-a', 1, 60).allowed).toBe(false);
  });
});

describe('getClientIp', () => {
  it('reads the first address from a comma-separated x-forwarded-for header', () => {
    const request = makeRequest({ 'x-forwarded-for': '203.0.113.1, 70.41.3.18, 150.172.238.178' });

    expect(getClientIp(request)).toBe('203.0.113.1');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const request = makeRequest({ 'x-real-ip': '203.0.113.5' });

    expect(getClientIp(request)).toBe('203.0.113.5');
  });

  it('falls back to "unknown" when neither header is present', () => {
    const request = makeRequest();

    expect(getClientIp(request)).toBe('unknown');
  });
});

describe('rateLimitResponse', () => {
  it('returns null (request allowed) when under the limit', () => {
    const request = makeRequest({ 'x-forwarded-for': '198.51.100.1' });

    const response = rateLimitResponse(request, {
      routeKey: 'test-route-allowed',
      limit: 5,
      windowSeconds: 60,
    });

    expect(response).toBeNull();
  });

  it('returns a 429 with a Retry-After header once the limit is exceeded', () => {
    const request = makeRequest({ 'x-forwarded-for': '198.51.100.2' });
    const options = { routeKey: 'test-route-blocked', limit: 1, windowSeconds: 60 };

    rateLimitResponse(request, options);
    const response = rateLimitResponse(request, options);

    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
    expect(response?.headers.get('Retry-After')).toBeTruthy();
  });

  it('rate-limits each client IP independently', () => {
    const options = { routeKey: 'test-route-per-ip', limit: 1, windowSeconds: 60 };
    const requestA = makeRequest({ 'x-forwarded-for': '198.51.100.10' });
    const requestB = makeRequest({ 'x-forwarded-for': '198.51.100.11' });

    rateLimitResponse(requestA, options);

    expect(rateLimitResponse(requestA, options)?.status).toBe(429);
    expect(rateLimitResponse(requestB, options)).toBeNull();
  });
});
