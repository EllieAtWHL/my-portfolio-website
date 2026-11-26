// Public, read-only Spurs Women MCP server (WEB-249). Anyone can connect, e.g.
// `claude mcp add --transport http spurs-women https://<domain>/spurs-women/mcp`.
// See reference/spurs-women/mcp/README.md.
//
// Lives under /spurs-women (not /api) because it is Spurs Women-specific and
// is a URL people paste into their AI client. Route handlers ignore the
// section layout, and the middleware matcher only covers /spurs-women/admin
// and /profile, so nothing else under this path applies to it.
//
// SECURITY: no auth by design - it only serves data the fan site already shows
// publicly. Only ever register read tools here; write tools and supabaseAdmin
// must never be imported into this route (the admin server is a separate route).
import { createMcpHandler } from 'mcp-handler';
import { registerReadTools } from '@/lib/mcp/read-tools';
import { rateLimitResponse } from '@/lib/rate-limit';

const mcpHandler = createMcpHandler(registerReadTools, {
  serverInfo: { name: 'spurs-women', version: '1.0.0' },
  instructions:
    'Data from an unofficial Tottenham Hotspur Women fan site: fixtures, results, line-ups, player stats, ' +
    'seasons, opponents and grounds. Use the search_* and list_seasons tools to find ids before calling ' +
    'the get_* tools, and get_leaderboard for rankings (top scorers, most appearances). List tools are ' +
    'paginated - check has_more and pass offset for the next page. Stats cover only the seasons on record ' +
    '(list_seasons), not the full club history.',
});

async function handler(request: Request): Promise<Response> {
  // One agent question can fan out into several tool calls, so this is looser
  // than the 30/min on the news/podcast proxies, but still tight: the quotas
  // behind it are free-plan hard caps shared with the whole site. In-memory
  // and per-instance (see src/lib/rate-limit.ts) - a Vercel Firewall rule on
  // /spurs-women/mcp is the real backstop if this is ever abused.
  const rateLimited = rateLimitResponse(request, {
    routeKey: 'mcp-public',
    limit: 60,
    windowSeconds: 60,
  });
  if (rateLimited) {
    return rateLimited;
  }

  return mcpHandler(request);
}

export { handler as GET, handler as POST, handler as DELETE };
