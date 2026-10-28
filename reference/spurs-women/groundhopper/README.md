# Groundhopper

A daily map game at `/spurs-women/groundhopper`: each day you're shown five
football grounds from around England, Wales and Scotland (one of them always a
Spurs Women ground), one at a time, and tap where you think each one is.
Closer taps score more. Epic: [WEB-218](https://eleanormatthewman.atlassian.net/browse/WEB-218);
first version: [WEB-219](https://eleanormatthewman.atlassian.net/browse/WEB-219);
bigger pool: [WEB-224](https://eleanormatthewman.atlassian.net/browse/WEB-224) (schema) and
[WEB-222](https://eleanormatthewman.atlassian.net/browse/WEB-222) (code + import).

It's an original game in the general location-guessing genre (MapTap,
GeoGuessr, Worldle etc.), with its own name, scoring and look. It is linked
from the **Games** card on the main site's Projects page
(`src/components/ProjectsContent.tsx`) and from the Stadiums page.

## Rules

- **Daily set:** 5 stadiums, the same for everyone, chosen by the UK calendar
  date (`Europe/London`), so the day rolls over at UK midnight. No backend:
  `dailyStadiums` sorts the pool by id and shuffles it with a PRNG seeded from
  the date.
- **One Spurs Women ground a day:** one of the five always comes from the
  `spurs_women = true` grounds (if any are playable), in a random round. It's
  marked "Spurs Women ground" on the reveal and in the results. Only these
  grounds link to a stadium page in the results, because the others don't have
  one (their pages 404).
- **Score:** `100 × e^(-km / 50)` per round, rounded. Within 1 km scores
  100, 35 km scores about 50, and 250 km scores about 1. The maximum is 500 a day.
- **Hint:** reveals the stadium's city, and caps that round at 50. It's
  saved the moment it's shown, so reloading can't hide it and lift the cap.
- **Reveal:** the real location, a line to your guess, the distance, the
  current sponsor name (from `stadium_names`, when it differs from `name`),
  and the city, capacity and opening year.
- **Share text:** `Groundhopper #<day> - <total>/<max>` plus the per-round
  scores (a `*` marks a hinted round) and the link. It never includes
  stadium names. Day 1 is 2026-10-28 (`LAUNCH_DATE_KEY`).
- **Streak:** consecutive UK days with a finished game. It shows as 0 once a
  day has been missed.
- **Midnight:** a tab left open past UK midnight reloads into the new day
  when it becomes visible again.

## Data

The game plays on every row of `stadia` with coordinates: the Spurs Women
grounds, plus grounds imported only for the game. One table, split by the
`spurs_women` flag (added in WEB-224; decided with Ellie, 2026-10-28, rather
than a separate table):

- **`spurs_women = true`:** grounds on the Spurs Women pages. That's every
  ground entered through admin (the checkbox defaults to ticked).
- **`spurs_women = false`:** Groundhopper-only grounds, from the import below.
  Every Spurs Women stadium fetcher in `src/lib/data/stadiums.ts`
  (`getAllStadiums`, `getStadiumsWithMatchCounts`, `getStadiumsForTeam`,
  `getStadiumBySlug`) filters these out, and a test pins each one, so they
  never appear on the Stadiums page, team pages or stadium pages.
- **Promotion is automatic:** saving a match at a Groundhopper-only ground
  sets `spurs_women = true` (the `matches_promote_stadium_to_spurs_women`
  trigger, WEB-224), so it moves onto the Spurs Women pages when Spurs Women
  play there. The match routes also clear the `stadiums` cache tag. The admin
  match form's dropdown keeps showing the old "Groundhopper only" label until
  the admin page is reloaded.
- **Demotion is guarded:** the stadia admin route refuses to untick "Spurs
  Women ground" on a ground that has matches, since every match's stadium link
  would 404.
- **Admin:** the stadium form has the checkbox, and the stadiums list has a
  "Show" filter (Spurs Women grounds by default). The match form's stadium field
  has a type-to-filter box, lists Spurs Women grounds first, and marks the
  others "Groundhopper only".

- The page (`src/app/spurs-women/groundhopper/page.tsx`) reads
  `getGroundhopperStadiums` (every ground with coordinates) through the data
  layer. Current sponsor names (`getStadiumNames`/`getCurrentStadiumName`) are
  only looked up for Spurs Women grounds; imported ones have no name history.
  A failed names lookup just means no "now known as" line for that stadium.
  Known limitation: name history added to a Groundhopper-only ground isn't
  shown until it becomes a Spurs Women ground (one bulk names query would fix
  this and the per-stadium lookups, see
  [WEB-221](https://eleanormatthewman.atlassian.net/browse/WEB-221)).
  The page is statically rendered and revalidated with the stadium cache
  TTL/tags, like the Stadiums page.
- `toGroundhopperStadium` drops anything without valid `latitude`/`longitude`,
  including `(0, 0)`, which is an unfilled form rather than a real location.
  That excludes placeholder rows like "Behind closed doors", and real grounds
  that haven't had coordinates entered yet. Wrong coordinates mean wrong
  answers, so check them when adding a stadium. The known bad and missing rows
  at launch are listed in [WEB-220](https://eleanormatthewman.atlassian.net/browse/WEB-220).
- Adding a stadium reshuffles the day's set for anyone who hasn't started.
  A game already in progress keeps its own stadium ids, saved in
  localStorage. If one of those stadiums has since been removed or lost its
  coordinates, the day starts over.

## Importing grounds (re-run each season)

`npm run import-groundhopper-stadiums` adds the current home grounds of the
Premier League, EFL Championship, League One, League Two, Scottish
Premiership, WSL and WSL 2 as Groundhopper-only grounds. **It's a dry run by
default.** Read its output, then re-run with `-- --apply` to write to
production. After applying, it clears the `stadiums` cache tag (needs
`CACHE_API_KEY` in `.env.local`).

- **Which grounds:** read from each league's current-season Wikipedia
  article ("Stadiums and locations" table; season worked out from the date,
  or pass `-- --season=2027–28`). Wikidata itself is the decided source for
  the facts, but its league-membership data is too patchy to say who's in a
  league this season (most season items list no participants), so the
  articles supply the list.
- **Facts about each ground:** coordinates, capacity, opening date and
  country (England/Wales/Scotland, via "located in") come from Wikidata
  (CC0), from the item each table row links to. The town comes from the
  table's location column.
- **Gaps:** where the table has no location column (the Scottish
  Premiership's), or Wikidata has no "located in" chain (e.g. Everton's new
  ground), the town and country come from an OpenStreetMap reverse geocode of
  the coordinates. Wikidata's own "located in" is often a council area
  ("East Ayrshire" rather than Kilmarnock), which makes a poor hint.
- **Never duplicates or overwrites:**
  - A ground already in `stadia` with the same `wikidata_qid` is left as it is.
  - A ground within 500 m of an existing row without a QID is treated as the
    same ground. That row gets its `wikidata_qid`, and only its blank fields
    are filled; `spurs_women` is never touched. Pairs are matched
    closest-first, so neighbouring grounds (Dundee's are ~200 m apart) can't
    take each other's row.
  - Everything else is inserted with `spurs_women = false`.
- **Rejects bad data:** grounds with no Wikidata coordinates, or coordinates
  outside Britain, are listed under "Skipped" and not written. The CHECK
  constraint and unique index on `wikidata_qid` (WEB-224) back this up.
- **Relegated clubs' grounds stay:** a ground isn't removed when its club
  goes down, since it's still a real ground. Delete it through admin if you
  don't want it in the pool.

Logic: `scripts/lib/groundhopper-stadium-import.js` (pure, tested in
`scripts/__tests__/groundhopper-stadium-import.test.js`). Network and
database: `scripts/import-groundhopper-stadiums.js`. Wikipedia and Wikidata
both rate-limit, so the script spaces out requests and backs off on HTTP 429.

## Files

| File | Role |
|------|------|
| `src/lib/groundhopper.ts` | Pure logic: playable filter, distance (haversine), scoring, UK date key, daily selection, streak, share text |
| `src/hooks/useGroundhopperGame.ts` | Game state and localStorage persistence (`groundhopper:v1:game`, `groundhopper:v1:streak`; every access is try/catch, so the game still plays without storage; anything read back is shape-checked, and corrupt entries are discarded) |
| `src/components/spurs-women/groundhopper/GroundhopperLoader.tsx` | Loads the game client-only (`next/dynamic`, `ssr: false`), because it needs the visitor's date and localStorage on first render and Leaflet touches `window` on import |
| `src/components/spurs-women/groundhopper/GroundhopperGame.tsx` | Round panel, actions, results summary |
| `src/components/spurs-women/groundhopper/GroundhopperMap.tsx` | Leaflet map, imperatively managed in effects (no react-leaflet) |
| `src/styles/groundhopper.css` + `groundhopper-layer.css` | Styles, plus Leaflet's own CSS. Both are imported through the layer wrapper (see `reference/CSS_ARCHITECTURE.md`) and only on this page |

Tests: `src/lib/__tests__/groundhopper.test.ts`,
`src/components/spurs-women/groundhopper/__tests__/` (the game with the map
mocked, and the real map under jsdom), and `tests/spurs-women/groundhopper.spec.ts`.

## Map

- **Tiles:** Esri's *Dark Gray Canvas base* layer
  (`server.arcgisonline.com/.../Canvas/World_Dark_Gray_Base`). Its place
  names are in a separate reference layer that we deliberately don't load,
  because a labelled map would give the answers away. It needs no API key.
  CARTO's `dark_nolabels` was the first choice, but it now serves an "API key
  required" placeholder, and Stadia Maps needs a registered domain. Tiles are
  `<img>`s, which the CSP's `img-src https:` already allows, so `next.config.ts`
  didn't need a change. Esri attribution is shown in the map corner.
- **Max zoom is 13.** The base layer starts drawing road names (including the
  odd "Stadium Way") from about zoom 15. At 13 only county boundary names and
  the odd river name ("River Thames") appear, and individual London grounds
  are still easy to tell apart.
- **Keyboard:** the map container is focusable. Arrow keys pan (Leaflet's own
  handler), and Enter/Space drops the pin at the centre crosshair. The
  crosshair and focus ring are keyed off a `data-keyboard` attribute, set on
  keydown and cleared on pointerdown, rather than `:focus-visible`, which
  Chrome also matches after a mouse click on the map.
- **Marker colours** are set by CSS classes (`groundhopper-guess-marker` and
  so on) using the site's variables. CSS beats the SVG presentation attributes
  Leaflet writes.

## Ideas not built yet

Track these in Jira under WEB-218 if they're picked up: a results map showing
all five guesses, old-name or "opened in" clue modes, and a practice mode
that isn't tied to the date. The European leagues are a separate daily mode,
[WEB-223](https://eleanormatthewman.atlassian.net/browse/WEB-223).
