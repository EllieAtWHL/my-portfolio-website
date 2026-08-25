# Weekly player stats research job (WEB-114)

A scheduled Claude cloud routine (via `/schedule` - see
`https://claude.ai/code/routines`) that surveys recently completed Spurs Women
matches for missing `player_stats` coverage and researches lineups/goals/
assists/cards for them, so newly played matches don't join the historical
backlog that WEB-113 is clearing.

## Scope: research and report, not auto-insert

The original ticket described an agent that auto-inserts sourced records. In
practice this was descoped to **research + report only**, for one reason: a
`/schedule` cloud routine runs in an isolated Anthropic-cloud sandbox with no
access to local files, local services, or local environment variables, and
the routine-creation API has no mechanism to inject a secret scoped to just
that routine. The only way to get a real credential into a routine today
would be embedding it directly in the routine's prompt/config text - which
would sit in cleartext in a routine definition that can't be deleted, only
disabled, once created. That's not an acceptable way to hold
`SUPABASE_SERVICE_ROLE_KEY` (the service-role client bypasses RLS entirely).

So instead:

- The routine only **reads** via the public anon Supabase client (the same
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` already shipped
  to every browser - not a secret) to find matches needing research, and
  researches them from public sources.
- It posts a **run summary as a comment on WEB-114** (matches checked,
  sourced data per match, or "couldn't confidently source") rather than
  writing to Supabase.
- Ellie reviews the comment and applies inserts manually, reusing whatever
  write path/sanity checks WEB-113 establishes for the backfill (Supabase
  service-role client, run locally - never exposed to the routine).

If a proper secrets store for routine environments becomes available in
future, revisit giving the routine the narrower of "a dedicated internal API
token" (not the raw service-role key) to close the loop on auto-insert.

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
BBC Sport has no coverage for 2022/23 but does cover current fixtures, so the
routine researches each flagged match against BBC Sport and
tottenhamhotspur.com match reports via the `WebFetch`/`WebSearch` tools - no
browser/Playwright automation connector is currently attachable to a cloud
routine, so full BBC Sport Playwright browsing (as used interactively during
WEB-113) isn't available here; static match-report HTML is fetched directly
instead.

## Cadence

Runs weekly. See the routine itself at `https://claude.ai/code/routines` for
the exact schedule and to disable/update it.
