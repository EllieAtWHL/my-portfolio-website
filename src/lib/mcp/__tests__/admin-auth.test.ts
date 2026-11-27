/**
 * @jest-environment node
 */
import { timingSafeEqual } from 'node:crypto';
import {
  extractBearerToken,
  isAuthorizedAdminRequest,
  tokensMatch,
  unauthorizedResponse,
} from '@/lib/mcp/admin-auth';

// Wrap the real timingSafeEqual so the constant-time comparison can be asserted.
jest.mock('node:crypto', () => {
  const actual = jest.requireActual('node:crypto');
  return { ...actual, timingSafeEqual: jest.fn(actual.timingSafeEqual) };
});

const TOKEN ='a-long-random-test-token-0123456789abcdef';

function requestWith(authorization?: string): Request {
  const headers: Record<string, string> = {};
  if (authorization !== undefined) {
    headers.Authorization = authorization;
  }
  return new Request('https://example.com/spurs-women/mcp/admin', { method: 'POST', headers });
}

describe('extractBearerToken', () => {
  it('reads a Bearer token, case-insensitively and trimmed', () => {
    expect(extractBearerToken(requestWith(`Bearer ${TOKEN}`))).toBe(TOKEN);
    expect(extractBearerToken(requestWith(`bearer   ${TOKEN}  `))).toBe(TOKEN);
  });

  it('returns null for a missing header or another scheme', () => {
    expect(extractBearerToken(requestWith())).toBeNull();
    expect(extractBearerToken(requestWith(`Basic ${TOKEN}`))).toBeNull();
    expect(extractBearerToken(requestWith('Bearer'))).toBeNull();
    expect(extractBearerToken(requestWith(TOKEN))).toBeNull();
  });
});

describe('tokensMatch', () => {
  it('matches only identical tokens, whatever their lengths', () => {
    expect(tokensMatch(TOKEN, TOKEN)).toBe(true);
    expect(tokensMatch(`${TOKEN}x`, TOKEN)).toBe(false);
    expect(tokensMatch('short', TOKEN)).toBe(false);
    expect(tokensMatch('', TOKEN)).toBe(false);
  });

  it('compares with crypto.timingSafeEqual on equal-length buffers', () => {
    const spy = jest.mocked(timingSafeEqual);
    spy.mockClear();
    tokensMatch('short', TOKEN);
    expect(spy).toHaveBeenCalledTimes(1);
    const [a, b] = spy.mock.calls[0] as unknown as [Buffer, Buffer];
    expect(a.length).toBe(b.length);
  });
});

describe('isAuthorizedAdminRequest', () => {
  it('accepts the configured token', () => {
    expect(isAuthorizedAdminRequest(requestWith(`Bearer ${TOKEN}`), TOKEN)).toBe(true);
  });

  it('rejects a missing token', () => {
    expect(isAuthorizedAdminRequest(requestWith(), TOKEN)).toBe(false);
  });

  it('rejects a wrong token', () => {
    expect(isAuthorizedAdminRequest(requestWith('Bearer not-the-token'), TOKEN)).toBe(false);
    expect(isAuthorizedAdminRequest(requestWith(`Bearer ${TOKEN.slice(0, -1)}`), TOKEN)).toBe(false);
  });

  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['blank', '   '],
  ])('fails closed when the env var is %s, even for an empty or matching-looking token', (_label, expected) => {
    expect(isAuthorizedAdminRequest(requestWith(), expected)).toBe(false);
    expect(isAuthorizedAdminRequest(requestWith('Bearer '), expected)).toBe(false);
    expect(isAuthorizedAdminRequest(requestWith(`Bearer ${TOKEN}`), expected)).toBe(false);
  });

  it('reads MCP_ADMIN_TOKEN from the environment by default', () => {
    const original = process.env.MCP_ADMIN_TOKEN;
    try {
      delete process.env.MCP_ADMIN_TOKEN;
      expect(isAuthorizedAdminRequest(requestWith(`Bearer ${TOKEN}`))).toBe(false);

      process.env.MCP_ADMIN_TOKEN = TOKEN;
      expect(isAuthorizedAdminRequest(requestWith(`Bearer ${TOKEN}`))).toBe(true);
      expect(isAuthorizedAdminRequest(requestWith('Bearer wrong'))).toBe(false);
    } finally {
      if (original === undefined) {
        delete process.env.MCP_ADMIN_TOKEN;
      } else {
        process.env.MCP_ADMIN_TOKEN = original;
      }
    }
  });
});

describe('unauthorizedResponse', () => {
  it('is a 401 with a Bearer challenge and a generic body', async () => {
    const response = unauthorizedResponse();
    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toMatch(/^Bearer /);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });
});
