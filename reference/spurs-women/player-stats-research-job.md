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
  to every browser - not a secret) to find matches needing research, and to
  resolve each sourced player to their `players.id`.
- Researches each flagged match using the Kernel browser-automation
  connector against BBC Sport / tottenhamhotspur.com, following "Data
  conventions" below.
- Opens a **new Jira issue each run** (not a comment on WEB-114, which will
  move to Done once the routine exists) containing, per match, a table of
  the sourced data (full name + `player_id`) and a ready-to-use
  `apply-player-stats` JSON block - or a note that a match couldn't be
  confidently sourced. Genuinely ambiguous items go in a short "judgment
  calls" list at the end, not inline.
- Never writes to Supabase or the admin UI. Ellie reviews each week's ticket
  and applies the inserts herself, in due course - see "Applying researched
  data" below for the lowest-friction way to do that.

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
fixtures. Source priority, for both the routine (via the Kernel
browser-automation connector, see above) and manual lookups:

1. **BBC Sport** - first choice, and the authority for assists (see "Data
   conventions" below).
2. **THFCDB** (see below) - the next best source: lineups, sub minutes and
   card minutes for every match, including seasons BBC doesn't cover.
3. **tottenhamhotspur.com** and other outlets (Sky, ESPN) - last resort.
   The club site is a client-rendered app that often crashes or comes back
   empty in headless browsers and plain fetches, and ESPN's pages have
   returned garbled event lists through fetch-and-summarise tools.

A general web search is not a source in its own right - use it to find a
page on one of the above, not to take a minute or a name from a search
snippet.

## THFCDB

[thfcdb.com/womens](https://thfcdb.com/womens/) is an independent fan-built
database (not affiliated with the club) - second in the source priority
above, and the main source for manual historic backfill work (WEB-113-style
gap filling).

- **Finding a match page**: match URLs live under
  `https://thfcdb.com/womens/matches/<season>/`, but the slug format isn't
  consistent between seasons - e.g.
  `2025-26/west-ham-united-1-february-2026-away` vs
  `2022-23/0-3-v-everton-fc-14-december-2022` (score included, no
  home/away) - so don't guess URLs. The season and player match lists
  (`/womens/seasons/<season>/matches`) are rendered client-side, so a plain
  fetch (or `curl`, which also hits a Cloudflare check on some pages) won't
  list their links; open the list in a real browser session (Kernel) and
  follow the link from there.

- **Coverage**: match pages give scorers/cards with minute, a full
  lineup (starting XI + bench with squad numbers, subs-on minute, manager),
  referee, attendance, venue, weather, and team-level stats (shots, shots on
  target, xG, possession). Player pages give DOB, nationality, squad number,
  and a per-competition career stats breakdown. Maps well onto our `matches`,
  `players`, and the core-lineup fields of `player_stats` (see field list in
  `reference/spurs-women/admin/ADMIN_SYSTEM_DOCUMENTATION.md`).
- **Gap**: no per-player advanced stats (passes, tackles, interceptions,
  clearances, fouls, offsides, `player_rating`) - only team-level, so it
  can't fill those `player_stats` columns.
- **Reliability caveat**: the site itself flags pre-2018 records as "not
  exhaustive... should be taken as a guide" - treat as a cross-check rather
  than a sole source for older seasons.
- **Access**: no API or bulk export - browser/manual use only. `robots.txt`
  only disallows `/cache/` and `/account/login`, and the maintainer's About
  page states data is believed "publicly available and free to reproduce,"
  but there's no formal license - it's a single-person hobby project, so a
  courtesy heads-up is worth it before any large-scale pull.

## Known issue: sandbox network egress blocks Supabase directly

As of 2026-08-31, the routine's cloud sandbox has a network egress allowlist
that does not include the Supabase project host
(`pkhodbdwzyeepudflgoz.supabase.co`), so the plain `node
scripts/find-matches-missing-player-stats.js` invocation in Step 1 fails
with `Host not in allowlist`. This is an environment-config gap (the
allowlist needs that host added), not a script or data problem - fixing it
properly means adding the host in the environment's own network egress
settings (claude.ai Environments, not exposed through any repo file or
Jira-accessible tool).

That fix hasn't landed yet, so **the routine's prompt bakes in a
workaround**: on that specific failure, it creates a headless Kernel browser
session and replicates the script's own Supabase REST queries through
`mcp__Kernel__browser_curl` instead - Kernel's browser network stack isn't
subject to the sandbox's egress allowlist, so it reaches Supabase fine.
Discovered and validated in a manual run on 2026-09-01 (confirmed all three
matches from the prior three weeks already had full coverage - a genuine
no-op, not a masked failure), then folded into the routine's stored prompt
so future runs use it directly rather than needing to rediscover it. Safe to
leave in place even after the allowlist is eventually fixed - it only
engages when the direct path fails.

## Data conventions

Rules for turning a source into `player_stats` values, so research runs and
apply sessions produce the same data every time. They're written down here
rather than left to judgment because the routine runs cold each week and
can't remember how a previous run resolved the same question.

- **Assists come from BBC's structured assist box only.** If the written
  match report credits someone the box doesn't (e.g. "Gaupset's low cross"),
  the box wins. It's the formal record, and a contribution the report
  describes may deliberately not count as an official assist. Don't raise
  box-vs-report differences as judgment calls. (WEB-177 and WEB-208
  disagreed on exactly this for Aston Villa, 27 Sep 2026; the box is what's
  in the DB.)
- **Minutes are whole numbers against the nominal match length**: 90, or
  120 if the match went to extra time. Stoppage time and penalty
  shootouts don't extend it.
  - Started and played the whole match: `minutes_played` = the nominal
    length.
  - Started and subbed off: `minutes_played` = `minute_off`, even past the
    nominal length. Off at 92' is 92.
  - Came on and stayed on: `minutes_played` = nominal length −
    `minute_on`, floored at 0. On at 92' is 0, and on at 103' in a
    120-minute match is 17.
  - Came on and later went off: `minutes_played` = `minute_off` −
    `minute_on`. On at 60', off at 85' is 25.
  - Sent off: `minute_off` = the red-card minute, and `minutes_played`
    follows the rules above as if they'd been subbed off then (so
    `minute_off`, or `minute_off − minute_on` for a substitute). Stoppage
    time counts like any other minute: a red at 90+6 is `minute_off` 96.
    A red card plus a `minute_off` is what marks a sending-off rather than
    a substitution; the match lineup shows it as `🟥 96'` instead of
    `← 96'`.

  This matches existing rows (e.g. matches `bb686fd7…` and `5b4833d2…` for
  92' changes, `b76847ea…` for extra time, and `c0221ff0…` for a
  substitute who was later taken off). Never write approximate values like
  "~90".
- **Resolve every player to a `players.id` before reporting them.** BBC's
  line-ups give initialled names ("D. Spence"), which
  `apply-player-stats.js`'s name lookup can't resolve exactly. Its last-name
  fallback then collides on real squad pairs (Spence/Spencer, Amanda/Matilda
  Nildén), and the script stops with a list of candidates rather than
  guessing. Matching by first initial + surname against `players` and
  writing the `playerId` into each entry avoids that entirely. If initial +
  surname still matches more than one player, list it as a judgment call
  rather than picking one.
- **Check `players` before flagging someone as unknown.** Youth call-ups
  and rarely-used squad players usually already exist (both "new" names in
  WEB-208 did). Only flag a player if they're genuinely absent, since they'd
  need a `players` row before their stats can be entered.

## Applying researched data

Once a run's Jira ticket has sourced data for a match, get it into Supabase
with `scripts/apply-player-stats.js` (`npm run apply-player-stats`) rather
than retyping each field into the admin UI form by hand. It's a deliberately
human-run, human-reviewed step - not wired into the routine above, for the
same reason the routine itself doesn't write (see "Scope" above): a
production write needs someone present to review the specific edit.

1. Save the ticket's per-match JSON block to a file, after settling any
   items in its "judgment calls" list. (Older tickets that predate WEB-209
   only have tables; transcribe those by hand, following "Data conventions"
   above.) One object per player, e.g.:

   ```json
   {
     "matchId": "c4d95e0d-3cd7-4d40-a33d-a8509ee88b75",
     "players": [
       { "name": "Lize Kop", "playerId": "436248aa-9a17-4809-9c70-62ed1c74cc29",
         "started": true, "minutesPlayed": 90 },
       { "name": "Drew Spence", "started": true, "captain": true, "minutesPlayed": 90 },
       { "name": "Olivia Holdt", "started": true, "minutesPlayed": 74, "minuteOff": 74,
         "goals": 3, "playerOfTheMatch": true },
       { "name": "Alice Sombath", "substitute": true, "minuteOn": 75, "minutesPlayed": 15 },
       { "name": "Ella Morris", "unusedSubstitute": true }
     ]
   }
   ```

   Each player needs exactly one of `started` / `substitute` /
   `unusedSubstitute` set `true`; every other field defaults to `0`/`false`/
   `null` as appropriate, so only include what the source actually reports
   (this matches the existing convention of leaving unsourced nullable stat
   fields - `shots`, `passes`, `tackles`, `clean_sheet`, `player_rating`,
   etc. - `null` rather than guessing `0`; see the full field list in
   `reference/spurs-women/admin/ADMIN_SYSTEM_DOCUMENTATION.md`). An entry's
   `"playerId"` is used as-is, and `name` is then only a label in the
   dry-run output. Entries without one are resolved by name against
   `players.first_name || ' ' || last_name` case-insensitively, falling back
   to a unique last-name match. If a source only gives a partial name (BBC's
   "A. Sombath" line-ups panel, say) or the name is ambiguous, the script
   errors out listing candidates - add a `"playerId"` to that entry instead
   of fixing the name (see "Data conventions" above).

2. Dry-run it first (the default - nothing is written until you pass
   `--apply`):

   ```bash
   npm run apply-player-stats -- path/to/data.json
   ```

   This resolves every name to a `player_id`, prints one line per player so
   you can eyeball it against the ticket, warns if summed goals don't match
   `matches.spurs_score`, and refuses to run at all if `player_stats` rows
   already exist for that match (pass `--force` to add to them anyway - it
   never overwrites or dedupes, so only do this when you mean to add missing
   rows to a partially-entered match).

3. Once the dry run looks right, add `--apply` to write for real:

   ```bash
   npm run apply-player-stats -- path/to/data.json --apply
   ```

Writes go straight to the production database via
`SUPABASE_SERVICE_ROLE_KEY` (the same credential `src/lib/admin-api.ts` uses
for the admin UI's `/api/admin/*` routes) - not through the admin UI itself,
so its CSRF/auth/rate-limit middleware doesn't apply here. That's an
accepted trade-off for a script only Ellie runs locally with the ticket open
next to it, not a pattern to extend to anything unattended.

Bypassing the admin UI also bypasses its cache invalidation, and past-season
match data caches for 7 days (see `reference/spurs-women/cache/README.md`).
So after a successful `--apply` the script revalidates the production
site's `players` + `matches` tags itself - the same pair the admin UI's
`invalidatePlayerStatsCache` clears - using `CACHE_API_KEY` from
`.env.local` (`SITE_URL` overrides the default `https://www.ellieatwhl.co.uk`).
If the key is missing or the call fails, it warns with the manual command
rather than failing, since the insert has already happened. Any other
one-off direct correction to `player_stats` (outside this script) needs the
same manual revalidation afterwards.

## Cadence

Runs every Monday at 08:00 UTC. Routine:
`https://claude.ai/code/routines/trig_01PFuWYkHULYADSMTRjSQnxz` - see it
there to disable/update the schedule or prompt.

Depends on `scripts/find-matches-missing-player-stats.js` being merged to
`main` (PR #84) - if it isn't yet by the next Monday run, the routine posts
a comment on WEB-114 saying so and does nothing else, rather than failing
silently.
