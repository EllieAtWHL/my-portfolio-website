# Groundhopper

A daily map game at `/spurs-women/groundhopper`: each day you're shown five
grounds Spurs Women have played at, one at a time, and tap where you think each
one is. Closer taps score more. Epic: [WEB-218](https://eleanormatthewman.atlassian.net/browse/WEB-218);
first version: [WEB-219](https://eleanormatthewman.atlassian.net/browse/WEB-219).

It's an original game in the general location-guessing genre (MapTap,
GeoGuessr, Worldle etc.), with its own name, scoring and look. It is linked
from the **Games** card on the main site's Projects page
(`src/components/ProjectsContent.tsx`) and from the Stadiums page.

## Rules

- **Daily set:** 5 stadiums, the same for everyone, chosen by the UK calendar
  date (`Europe/London`), so the day rolls over at UK midnight. No backend:
  `dailyStadiums` sorts the pool by id and shuffles it with a PRNG seeded from
  the date.
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

The game plays on whatever is in the `stadia` table, so adding a stadium
through the admin system adds it to the pool. No code change is needed. That
includes stadiums with no matches yet, which is deliberate: the pool is
whatever has been entered. The page copy says "grounds from the Spurs Women
archive" rather than "grounds Spurs Women have played at" for that reason.

- The page (`src/app/spurs-women/groundhopper/page.tsx`) reads
  `getAllStadiums` + `getStadiumNames`/`getCurrentStadiumName` through the
  data layer. A failed names lookup just means no "now known as" line for
  that stadium. It is statically rendered and revalidated with the stadium cache
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
  odd "Stadium Way") from about zoom 15. At 13 only county boundary names
  appear, and individual London grounds are still easy to tell apart.
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
that isn't tied to the date.
