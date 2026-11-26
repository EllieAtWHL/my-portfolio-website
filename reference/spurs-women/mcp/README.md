# Spurs Women MCP server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that lets an AI assistant such as Claude answer questions about Tottenham Hotspur Women from this site's data: fixtures, results, line-ups, player stats, seasons, opponents and grounds. Epic: [WEB-248](https://eleanormatthewman.atlassian.net/browse/WEB-248).

| Endpoint | Who | Tools | Status |
|---|---|---|---|
| `/spurs-women/mcp` | Anyone, no auth | Read only | Live ([WEB-249](https://eleanormatthewman.atlassian.net/browse/WEB-249)) |
| `/spurs-women/mcp/admin` | Ellie only, bearer token | Read + write | Planned ([WEB-250](https://eleanormatthewman.atlassian.net/browse/WEB-250), [WEB-251](https://eleanormatthewman.atlassian.net/browse/WEB-251)) |

## Connecting

**Claude Code:**

```bash
claude mcp add --transport http spurs-women https://www.ellieatwhl.co.uk/spurs-women/mcp
```

**claude.ai:** Settings → Connectors → Add custom connector, URL `https://www.ellieatwhl.co.uk/spurs-women/mcp`.

**Locally:** run `npm run dev` and use `http://localhost:3000/spurs-women/mcp`. To browse and call tools by hand, run `npx @modelcontextprotocol/inspector`, then connect it to that URL with the "Streamable HTTP" transport.

## How it works

- **Hosted inside the Next.js app.** It isn't a separate server. [`src/app/spurs-women/mcp/route.ts`](../../../src/app/spurs-women/mcp/route.ts) uses Vercel's [`mcp-handler`](https://www.npmjs.com/package/mcp-handler) (v2, on the official `@modelcontextprotocol/server` SDK v2). The route deploys with the rest of the site, and each request runs as an ordinary stateless Vercel function call. It serves both the current MCP spec and 2025-era Streamable HTTP clients.
- **Why `/spurs-women/mcp` rather than `/api/...`:** it's Spurs Women-specific, and it's a URL people paste into their AI client, so it sits in the section's own route tree.
  - Route handlers ignore the section layout.
  - The middleware only matches `/spurs-women/admin` and `/spurs-women/profile`, so nothing else under `/spurs-women` applies to it.
  - `robots.ts` disallows it alongside `/api/`.
  - The admin server goes at `/spurs-women/mcp/admin`, *not* `/spurs-women/admin/mcp`. The middleware sends any request under `/spurs-women/admin` without a login cookie to the sign-in page, which would block MCP clients: they send a token instead.
  - The site's other API routes are Spurs Women-specific too, but still under `/api/` for now. Moving them is tracked in [WEB-255](https://eleanormatthewman.atlassian.net/browse/WEB-255).
- **Why not a standalone stdio server** (a local process Claude Code launches): the data layer relies on Next's `unstable_cache`, which only works inside the Next runtime. A stdio server could only be used on Ellie's machine, and it would have to query Supabase directly, bypassing `src/lib/data/` and its cache.
- **Tools are plain data.** [`src/lib/mcp/read-tools.ts`](../../../src/lib/mcp/read-tools.ts) defines each tool as a name, description, zod input schema and handler. `registerReadTools(server)` registers them all. Keeping them as data means Jest can test them without loading the ESM-only MCP SDK: the SDK is only a type import there, plus the route.
- **Every handler reads through the cached `src/lib/data/` fetchers.** It never queries Supabase directly. Results are trimmed by [`src/lib/mcp/format.ts`](../../../src/lib/mcp/format.ts) to the facts, dropping colours, SVG icons and unused columns, to keep responses small for the model.
- **Results** come from [`src/lib/utils/match-result.ts`](../../../src/lib/utils/match-result.ts) and follow football record-keeping conventions:
  - an unscored fixture has no result (it isn't a 0-0)
  - extra time counts
  - a penalty shootout leaves the match a draw, with the shootout winner reported separately in `shootout_winner`
- **Errors:**
  - Invalid input (bad id format, limit too high) and not-found ids come back as tool errors that explain the problem, so the model can correct itself.
  - Anything unexpected is logged server-side and returned as a generic message, so database or internal details never reach a public client.

## Tools

The `search_*` and `list_*` tools exist to find the ids and slugs the `get_*` tools need. Every list tool is paginated: it returns `total`, `offset`, `limit`, `has_more` and `items`, and `limit` is capped at 50.

| Tool | Input | Returns |
|---|---|---|
| `get_upcoming_matches` | `limit` (≤20, default 5) | Next fixtures |
| `get_previous_matches` | `limit` (≤20, default 5) | Latest results |
| `get_match` | `match_id` | Score, venue, match stats, both line-ups with per-player stats, media links |
| `list_seasons` | none | Season ids, names, match counts |
| `get_season` | `season_id` | W/D/L record and every match |
| `get_season_review` | `season_id` | The written season review |
| `get_season_stats` | none | League stats per season (win %, goals per game, possession…), plus `percentageOfMatchesSiteOwnerAttended` (the % of matches Ellie went to, not crowd size) |
| `search_players` | `query`, paging | Matching players with career Tottenham apps/goals/assists |
| `get_player` | `player_id` | Profile and full club history |
| `get_player_history` | `player_id`, paging | Match-by-match appearances and stats |
| `search_teams` | `query`, paging | Matching teams with ids |
| `get_team` | `team_id` | The team and the all-time head-to-head record (for Tottenham itself: `all_time_record` instead) |
| `get_matches_v_team` | `team_id`, paging | Every match against that team |
| `search_stadiums` | `query`, paging | Matching grounds (Spurs Women grounds only) with slugs. Also matches sponsored and former names from `stadium_names`, returned as `other_names` |
| `get_stadium` | `slug` | Ground details and Tottenham's record there |
| `get_matches_at_stadium` | `slug`, paging | Every match at that ground |
| `get_news` | `limit` (≤10, default 5) | Latest headlines with links |

Match, player and season ids are UUIDs; team ids are integers; grounds use slugs. An unknown id or slug always comes back as a not-found error, never as an empty result, so the model can tell a typo from "never played there". In match results, `attendance` is the crowd size and `attended_by_site_owner` is whether Ellie was there.

To add a tool, add a `defineTool({...})` entry to `readTools`, with a test in `src/lib/mcp/__tests__/read-tools.test.ts` and a row in the table above. Write the `description` for the model: it's how Claude decides when to call the tool.

## Security

- **The public endpoint has no auth by design.** It exposes only what the public fan site already shows. Neither the `/api/admin` nor the `/spurs-women/admin` middleware guard (`src/lib/supabase/middleware.ts`) applies to it.
- **`read-tools.ts` and `/spurs-women/mcp` must never import `supabaseAdmin` or any write-capable code.** They use the anon-key client through the data layer, so RLS applies. Write tools will live in a separate module that only the admin route imports (WEB-251). A Jest test asserts every registered tool name starts with `get_`, `list_` or `search_`.
- **No CSP changes are needed.** MCP calls are server-to-server, not made from a browser page.

## Protecting the free-plan quotas

Vercel Hobby and Supabase Free hard-cap usage rather than billing for overages, and `/spurs-women/mcp` shares those quotas with the whole site. A bot hammering it wouldn't cost money, but it could take the site offline until the quota resets (Vercel Hobby: up to 30 days). The defences:

1. **Caching.** Every tool reads through the data layer's `unstable_cache`, so repeat questions are served without touching Supabase.
2. **Rate limit.** 60 requests per minute per IP (`rateLimitResponse`, `routeKey: 'mcp-public'`). It's looser than the news proxies' 30/min, because one question can fan out into several tool calls. It's in-memory and per-instance, so it's best-effort only (see `src/lib/rate-limit.ts`).
3. **Bounded responses.** Page sizes are capped, news snippets are truncated, and there's no "dump the whole table" tool.
4. **Backstop, if abuse appears:** add a Vercel Firewall rate-limit rule for `/spurs-women/mcp` (Project → Firewall → Add rule; available on Hobby). It's enforced at the edge across all instances, unlike the in-memory limiter. Check Vercel → Usage and Supabase → Usage regularly after launch.

## Testing

- **Unit:** `npx jest src/lib/mcp src/lib/utils/__tests__/match-result.test.ts` covers every tool handler (with the data layer mocked), validation, pagination, error mapping and the read-only guard.
- **E2E:** `npx playwright test tests/spurs-women/mcp.spec.ts` covers `initialize`, `tools/list` and a real tool call. It runs in the chromium project only, because it's HTTP-only.
- **Manually:** use the MCP Inspector (see Connecting), or `claude mcp add` against a Vercel preview URL and ask real questions.
