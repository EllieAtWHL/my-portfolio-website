// Private admin Spurs Women MCP server (WEB-250). Only Ellie can connect:
// `claude mcp add --transport http spurs-women-admin https://<domain>/spurs-women/mcp/admin \
//    --header "Authorization: Bearer <MCP_ADMIN_TOKEN>"`.
// See reference/spurs-women/mcp/README.md.
//
// SECURITY: this route is OUTSIDE both admin middleware guards. The middleware
// matcher (src/middleware.ts) covers /spurs-women/admin/* and /api/admin/*,
// which authenticate by login cookie and redirect or reject token-only MCP
// clients, so the route sits at /spurs-women/mcp/admin instead and does its own
// bearer-token auth (src/lib/mcp/admin-auth.ts). Every request must pass that
// check before reaching the MCP handler - never add a code path around it.
//
// For now it serves the same read tools as the public server. Write tools come
// in WEB-251, once WEB-83 has added validated admin services.
import { createMcpHandler } from 'mcp-handler';
import { registerReadTools } from '@/lib/mcp/read-tools';
import { isAuthorizedAdminRequest, unauthorizedResponse } from '@/lib/mcp/admin-auth';
import { rateLimitResponse } from '@/lib/rate-limit';

const mcpHandler = createMcpHandler(registerReadTools, {
  serverInfo: { name: 'spurs-women-admin', version: '1.0.0' },
  instructions:
    'Private admin access to the unofficial Tottenham Hotspur Women fan site data: fixtures, results, ' +
    'line-ups, player stats, seasons, opponents and grounds. Use the search_* and list_seasons tools to ' +
    'find ids before calling the get_* tools, and get_leaderboard for rankings. List tools are paginated - ' +
    'check has_more and pass offset for the next page. Read-only for now.',
});

async function handler(request: Request): Promise<Response> {
  // Same budget as /api/admin/*. Checked before auth so token guessing is
  // throttled too. In-memory and per-instance (see src/lib/rate-limit.ts).
  const rateLimited = rateLimitResponse(request, {
    routeKey: 'mcp-admin',
    limit: 120,
    windowSeconds: 60,
  });
  if (rateLimited) {
    return rateLimited;
  }

  if (!isAuthorizedAdminRequest(request)) {
    return unauthorizedResponse();
  }

  return mcpHandler(request);
}

export { handler as GET, handler as POST, handler as DELETE };
