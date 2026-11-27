import { createHash, timingSafeEqual } from 'node:crypto';

// Bearer-token auth for the private admin MCP server (WEB-250).
//
// That route (src/app/spurs-women/mcp/admin/route.ts) sits outside both admin
// middleware guards in src/lib/supabase/middleware.ts: those are cookie- and
// Origin-based, and MCP clients send an Authorization header instead. So this
// check is the route's only protection - keep it fail-closed.

/** Name of the env var holding the shared secret. */
export const MCP_ADMIN_TOKEN_ENV = 'MCP_ADMIN_TOKEN';

function sha256(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

/**
 * Constant-time token comparison. Both sides are hashed first so the buffers
 * are always the same length: `timingSafeEqual` throws on a length mismatch,
 * and an early length check would leak the token's length through timing.
 */
export function tokensMatch(provided: string, expected: string): boolean {
  return timingSafeEqual(sha256(provided), sha256(expected));
}

/** Pulls the token out of an `Authorization: Bearer <token>` header, or null. */
export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/**
 * True only if the server has a token configured and the request carries the
 * same one. An unset or blank env var rejects every request (fail closed),
 * so a missing Vercel env var can never leave the endpoint open.
 */
export function isAuthorizedAdminRequest(
  request: Request,
  expectedToken: string | undefined = process.env[MCP_ADMIN_TOKEN_ENV]
): boolean {
  if (!expectedToken || !expectedToken.trim()) {
    return false;
  }
  const provided = extractBearerToken(request);
  if (!provided) {
    return false;
  }
  return tokensMatch(provided, expectedToken.trim());
}

/**
 * The 401 sent for every failure. The body is deliberately the same whether
 * the token is missing, wrong, or unconfigured, so a caller can't tell which.
 */
export function unauthorizedResponse(): Response {
  return Response.json(
    { error: 'Unauthorized' },
    { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="spurs-women-admin"' } }
  );
}
