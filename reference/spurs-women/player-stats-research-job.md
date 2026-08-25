# Weekly player stats research job (WEB-114)

A scheduled Claude cloud routine (via `/schedule` - see
`https://claude.ai/code/routines`) that surveys recently completed Spurs Women
matches for missing `player_stats` coverage and researches lineups/goals/
assists/cards for them, so newly played matches don't join the historical
backlog that WEB-113 is clearing.

## Scope: research and report, not auto-insert

The original ticket described an agent that auto-inserts sourced records.
Two separate blockers ruled that out - not just a fixable technical gap, but
a mismatch between "fully unattended" and "writes to production":

1. **No way to hold a credential.** A `/schedule` cloud routine runs in an
   isolated Anthropic-cloud sandbox with no access to local files, local
   services, or local environment variables, and routine creation has no
   mechanism to inject a secret scoped to just that routine. The only way to
   get a real credential into a routine would be embedding it directly in
   the routine's prompt/config text - which sits in cleartext in a routine
   definition that can't be deleted, only disabled, once created. Not
   acceptable for `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS entirely).
2. **Even a credential-free write path hits the same wall for a deeper
   reason.** The [Kernel](https://kernel.sh) MCP connector (real headless
   browser infrastructure with stealth mode, validated below) can drive the
   actual `/spurs-women/admin` UI through a persisted, already-authenticated
   browser profile - no service-role key or password ever touches the
   routine at all. Attempting to build a test routine around this got
   blocked outright by Claude Code's auto-mode safety classifier: an
   autonomous agent writing to a live production database with nobody
   present to review the specific edit is exactly the class of action that
   layer exists to stop, regardless of which credential mechanism (or lack
   of one) is behind it. This isn't something to route around - production
   writes belong with a human in the loop, and a weekly unattended job is
   the wrong place for one by design.

So the routine:

- Only **reads** via the public anon Supabase client (the same
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` already shipped
  to every browser - not a secret) to find matches needing research.
- Researches each flagged match using the Kernel browser-automation
  connector against BBC Sport / tottenhamhotspur.com.
- Opens a **new Jira issue each run** (not a comment on WEB-114, which will
  move to Done once the routine exists) containing the sourced data per
  match, ready to paste into the admin UI - or a note that a match couldn't
  be confidently sourced.
- Never writes to Supabase or the admin UI. Ellie reviews each week's ticket
  and applies the inserts herself, in due course, via the normal admin UI.

## Kernel connector - validated 2026-08-25

Kernel (`https://mcp.onkernel.com/mcp`, connector name `Kernel`) is a hosted
browser-automation MCP server with stealth mode, built specifically to get
past bot detection like BBC Sport's. Two test routines confirmed it's viable
for the research step:

- **Access test:** loaded four real BBC Sport pages (fixtures list, team
  hub, scores & fixtures page, site search) with no CAPTCHA, block, or
  error. (The specific match tested - a pre-season friendly - turned out to
  have no BBC report at all, which is expected: BBC Sport generally doesn't
  publish full reports for friendlies, only competitive fixtures. That's a
  "couldn't confidently source" case the job already accounts for, not a
  Kernel failure.)
- **Extraction accuracy test:** researched a real WSL match (Tottenham 2-1
  Brighton, 16 May 2026) blind and compared the result against our own
  database. Both goalscorers, the final score, the captain, and the full
  lineup/substitution timing all matched exactly. One discrepancy: Kernel
  found a yellow card for Lize Kop that our database doesn't have recorded -
  likely a genuine gap in the existing (WEB-113-backfilled) data rather than
  a Kernel error, worth checking against the source
  (`https://www.bbc.com/sport/football/live/cj4pe57jergt`) and fixing
  manually.

Kernel's MCP connector UUID (for wiring into the routine's `mcp_connections`)
is `0c40e154-3015-4e3f-aaaa-5874f97c5a99`.

## Coverage survey script

`scripts/find-matches-missing-player-stats.js` (`npm run
find-missing-player-stats`) does the read-only survey step and is reusable
outside the routine too - the same one-off check WEB-113 ran manually.

- Looks at matches with `spurs_score is not null` in the last N days
  (`--since-days`, default 21).
- For each, checks `player_stats` rows for Tottenham's `team_id` (resolved
  via `teams.is_tottenham`, not a hardcoded id) against the same "core
  lineup" field list as WEB-113: `started`, `was_substitute`,
  `was_unused_substitute`, `minute_on`/`minute_off`, `minutes_played`,
  `goals`, `assists`, `yellow_cards`, `red_cards`.
- Flags `missing` (zero rows) or `partial` (rows exist but a core field is
  null for one of them); matches with full coverage are omitted from output.
- `captain` is deliberately **excluded** from the null check despite being
  part of the core-lineup definition: existing data stores "not captain" as
  either `false` or `null` depending on when the row was entered, so a null
  `captain` isn't a reliable signal of incomplete sourcing.

## Sourcing approach

No reliable stats API exists for current-season matches. WEB-113's backfill
found API-Football's free tier only covers the 2022-2024 seasons (see
`.web113-cache/README.md`, gitignored/local-only), so it doesn't help here.
BBC Sport has no coverage for 2022/23 but does cover current competitive
fixtures, so the routine researches each flagged match against BBC Sport and
tottenhamhotspur.com via the Kernel browser-automation connector (see above).

## Cadence

Runs weekly. See the routine itself at `https://claude.ai/code/routines` for
the exact schedule and to disable/update it.
