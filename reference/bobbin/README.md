# Bobbin

An ad-free, offline-capable conveyor colour-sorting puzzle game in the style of
Yarn Loop, installable on an Android phone as a PWA without the Play Store.
It will live at `/bobbin/` on this site. Tracked under epic
[WEB-192](https://eleanormatthewman.atlassian.net/browse/WEB-192).

**Status: planned.** Nothing is built yet. A playtested single-file prototype
exists as [`prototype.html`](./prototype.html) (open it directly in a
browser). It is the reference implementation for rules, generation and feel.
This doc started as the build spec (`YARN_SPEC.md`, 30 Sep 2026). It replaces
that spec and is now the source of truth. Where this doc and the prototype
disagree, this doc wins, and the difference is called out.

| Phase | Ticket |
|---|---|
| 1. Investigation and these docs | [WEB-193](https://eleanormatthewman.atlassian.net/browse/WEB-193) |
| 2. Port the pure core (rules, RNG, codes, generator, simulator) | [WEB-195](https://eleanormatthewman.atlassian.net/browse/WEB-195) |
| 3. Port the game (rendering, UI, state machine, Web Worker) | [WEB-196](https://eleanormatthewman.atlassian.net/browse/WEB-196) |
| 4. PWA and deploy at `/bobbin/` | [WEB-197](https://eleanormatthewman.atlassian.net/browse/WEB-197), blocked by [WEB-194](https://eleanormatthewman.atlassian.net/browse/WEB-194) |
| 5. Polish | See [Open decisions and backlog](#open-decisions-and-backlog) |

**Goals:** satisfying Yarn Loop-style gameplay with no ads, purchases or
tracking. Endless procedurally generated puzzles at three difficulties, each
reproducible from a short code. Installable and fully playable offline. A
clean, testable codebase that doubles as a game-dev learning project.

**Non-goals:** Play Store or App Store distribution, a level editor
(explicitly not wanted), monetisation, accounts, leaderboards, or any backend.

## Decisions

Made by Ellie on 3 Oct 2026:

| Decision | Choice |
|---|---|
| Name and URL | **Bobbin** at `/bobbin/`. The prototype's working title was "Yarn Loop", but the final name must differ from the commercial game. |
| Where the code lives | A Vite + TypeScript app inside this repo (see [Platform and hosting](#platform-and-hosting)) |
| Puzzle code versioning | Hidden versioning: today's codes (`M-4K7P`) mean generator v1 (see [Puzzle codes](#puzzle-codes)) |
| Belt direction | Keep the prototype's: enter bottom-left, run clockwise, up the left side first |
| Look and feel | The **main EllieAtWHL design system**, not the prototype's lavender/Fredoka look (see [Visual language](#visual-language)) |

## Game rules

The player clears a knitted picture by sending colour bobbins round a
conveyor belt. Each bobbin collects the outermost stitches of its own colour
until its capacity runs out.

**Board.** A W x H grid of stitches (square in all current levels). Each cell
holds one yarn colour, or is empty once collected. The level is won when every
stitch has been collected.

**Belt**

- A loop round the outside of the board with one position per row or column
  edge, so its length is L = 2W + 2H.
- Bobbins enter at the bottom-left corner and travel clockwise: up the left
  side, across the top, down the right side, back along the bottom, then exit
  at the bottom-left corner.
- The belt advances one position per tick (110 ms).
- At each position a bobbin looks straight into the board along that row or
  column. If the first non-empty stitch in that line matches the bobbin's
  colour and the bobbin has capacity left, it collects that stitch and its
  capacity drops by 1. A bobbin collects at most one stitch per tick.
- Belt capacity is limited per difficulty. A new bobbin can only enter when
  the entry corner is clear (no bobbin within 1 position of the start).

**Bobbins**

- Each has a colour and a capacity (the number shown on the spool).
- When capacity reaches 0, the bobbin is removed immediately with a small pop.
- A bobbin that completes a full loop with capacity left moves to the rack.
- For each colour, total bobbin capacity exactly equals the number of stitches
  of that colour.

**Supply**

- Bobbins are dealt into 3 columns. Only the front bobbin of each column can
  be tapped. The next two are shown dimmed for planning, and a "+N more" count
  shows the rest.
- Tapping queues the bobbin to enter the belt (it waits at the entry corner if
  needed). Taps are ignored when belt plus waiting bobbins would exceed belt
  capacity.

**Rack**

- A fixed number of waiting slots (3 to 5, by difficulty). Any rack bobbin can
  be tapped to send it round again.
- **Lose condition:** a bobbin completes its loop with capacity left while the
  rack is full.
- On losing, all movement freezes (no animation replays) and a Try again
  overlay appears.

**Auto-finish**

- When the total bobbins still in play (on the belt + waiting to enter + on
  the rack + in the supply columns) is less than or equal to the rack size,
  losing is impossible. The game then locks input, shows "Finishing up", and
  feeds every remaining bobbin onto the belt until the picture is complete.
- This came from a playtest bug fix: the count must include bobbins already on
  the belt. The prototype's simulator and game loop drifted apart on exactly
  this count, which is why the port shares one `step` function (see
  [Architecture](#architecture)).

## Procedural generation

There are no fixed levels. Every puzzle is generated from a puzzle code, and
the same code must always build exactly the same puzzle on any device.

### Puzzle codes

- Format `D-XXXX`. `D` is the difficulty (`E`, `M` or `H`). `XXXX` is 4
  characters from a 32-character alphabet without look-alikes
  (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`), giving about 1 million seeds per
  difficulty.
- Input is forgiving: case-insensitive, with the hyphen optional (`m4k7p`
  works). Invalid input shows: "Codes look like M-4K7P: E, M or H, then four
  letters or numbers."
- Players can copy the current code, and enter a code to replay or share a
  puzzle.
- All randomness comes from a seeded PRNG (mulberry32) derived from the code.
  **Never use `Math.random` inside generation or validation.** The prototype's
  `simulate()` defaults to `Math.random` when no RNG is passed. Generation
  always passes one, but the port should make the RNG required.
- **Versioning (hidden):** a code with no prefix means generator v1. When a
  change alters what codes build (new pictures, retuned difficulty, any change
  to the generator or simulator), the generator version is bumped. New codes
  then carry a visible numeric prefix (`2M-4K7P`), and the v1 generator is
  kept frozen so old codes still build the same puzzle. The prefix can't be
  confused with the rest of the code, because the difficulty letter always
  comes straight after it. Golden snapshot tests guard against accidental
  changes.

### Pipeline

1. **Seed:** derive the base PRNG from the seed and difficulty. Each attempt
   gets its own child PRNG, so retries stay deterministic.
2. **Picture:** pick the grid size and colour count from the difficulty
   config, choose colours at random from the palette, then run one picture
   generator.
3. **Bobbins by peeling:** repeatedly find all currently exposed stitches
   (the first stitch visible from any belt position), take the colour with the
   most exposed stitches, remove those, and record a bobbin of that size. Then
   merge consecutive same-colour bobbins, fold bobbins under 3 stitches into a
   neighbour of the same colour, and split any bobbin above the difficulty's
   max capacity into near-equal parts.
4. **Scramble:** sort bobbins by `index + random() * window`. A small window
   keeps the ideal outside-in order; a large window (100) is effectively a
   full shuffle.
5. **Deal:** distribute into 3 columns: round-robin, random, or mixed, per the
   difficulty config.
6. **Validate and calibrate:** run the simulated players (below). Reject
   unwinnable puzzles and puzzles outside the difficulty's target band, and
   retry up to 30 attempts. If none fits, keep the closest miss. The last
   resort is a guaranteed-solvable concentric-rings puzzle.

### Picture generators

| Generator | What it makes | Notes |
|---|---|---|
| Rings | Concentric circles, diamonds or squares in colour bands, sometimes split into alternating sectors | Buries colours in layers; the best source of hard puzzles |
| Waves | Horizontal or diagonal sine-wave stripes | Medium depth |
| Quilt | Left-right mirrored patchwork of 2x2 or 3x3 tiles (solid, diagonal split, or centre dot) | Varied, medium depth |
| Sprite | Mirrored blob creature with outline and spots, from smoothed noise | Playtested as almost trivially easy; Easy only |
| Mix | Wave background with a sprite on top | Easy and Medium |

### Palette

12 yarn colours, keyed `a`-`l` (the generator works on keys, not hex values,
so palette tweaks don't change what codes build):

| Key | Name | Hex |
|---|---|---|
| a | red | `#EF5B5B` |
| b | orange | `#F4A340` |
| c | yellow | `#F2C94C` |
| d | green | `#5FB36A` |
| e | teal | `#3FB8AF` |
| f | sky blue | `#8FD3DA` |
| g | blue | `#6C9BE8` |
| h | lilac | `#A98BE0` |
| i | pink | `#F29BC0` |
| j | plum | `#4A3560` |
| k | white | `#FFFFFF` |
| l | oatmeal | `#E9C99A` |

Colour-blind distinguishability hasn't been checked yet
([WEB-203](https://eleanormatthewman.atlassian.net/browse/WEB-203)).

## Difficulty calibration

Difficulty is measured, not guessed. Every generated puzzle is played by two
simulated players. It must be winnable by the careful one, while the casual
one's win rate lands in the difficulty's target band.

**Simulated players** use the same rules as the game, including auto-finish:

- **Smart** plans colour by colour. It sends a rack bobbin whose colour is
  exposed and not already on the belt. Otherwise it sends a useful column
  front (random tie-break). If nothing is useful and the belt is empty, it
  banks a random front onto the rack if there's space, or else resends a rack
  bobbin. It runs 5 times and must win at least once.
- **Casual** reacts to what it can see without planning. It only sends when
  fewer than 2 bobbins are on the belt, and picks a random option among fronts
  and rack, choosing an exposed colour 80% of the time. It runs 12 times to
  estimate a win rate.

**Difficulty configs**

| Setting | Easy | Medium | Hard |
|---|---|---|---|
| Grid size | 9-10 | 11-12 | 12-13 |
| Colours | 4 | 5 | 6 |
| Scramble window | 100 | 40 | 100 |
| Deal | random | random | random |
| Max bobbin capacity | 20 | 20 | 20 |
| Rack slots | 4 | 3 | 3 |
| Belt capacity | 4 | 4 | 4 |
| Pictures | all five | rings, waves, quilt, mix | rings (x2 weight), waves, quilt |
| Casual win-rate target | 45-85% | 15-45% | 0-12% |

The fallback rings puzzle uses rack 5 and belt 5, so it's always solvable.

**Measured results** (30 puzzles each, after the final prototype tuning; to be
re-measured by the calibration script in WEB-195):

| | Easy | Medium | Hard |
|---|---|---|---|
| Casual win rate | ~85% | ~31% | ~4% |
| Smart win rate | ~97% | ~97% | ~89% |
| Average bobbins | 9 | 13 | 14 |
| Generation time (desktop Node) | ~140 ms avg, ~580 ms max | ~65 ms avg | ~85 ms avg |

Easy often sits at the top of its band, so it could be nudged harder. In
playtesting, Hard felt genuinely challenging but beatable, and the earlier
configs felt far too easy at every level.

**What moved difficulty, and what didn't**

- Worked: larger bobbins (they rarely empty in one loop, so they clog the
  rack), a full scramble with random dealing, a smaller rack and belt, and
  pictures that bury colours in layers.
- Didn't work: linked bobbin pairs made almost no difference in simulation and
  were removed. (The prototype's `simulate()` still has dead `link` handling
  left over from them, which shouldn't be ported.) Sprite pictures are very
  easy because one background colour dominates.
- Levers for later: fewer visible upcoming bobbins, hidden ("?") bobbins, more
  colours, bigger grids.
- Caveat: the casual player is only a proxy for a human. Its thresholds should
  be checked against real playtesting, not treated as truth.

## UI, visuals and interaction

A single portrait screen, mobile first (max width about 460 px). The page
chrome is in the main site's style, and the board has a cosy knitted look
where each stitch is drawn as a knit "V". The UI copy uses British English
("colour").

**Layout, top to bottom**

1. Header: "Easy/Medium/Hard puzzle" title, the current code with a Copy
   link, and Restart and New buttons.
2. Difficulty segmented control (Easy, Medium, Hard). Choosing one starts a
   new puzzle at that level.
3. Board canvas: the belt as a dark rounded track with a moving stitched
   dashed centre line, a pale panel inside, and the stitch grid.
4. A first-run hint under the board, hidden once the first bobbin is sent.
5. The rack row, with a "Belt n of m" or "Finishing up" status on the right.
   The rack grid has as many columns as the difficulty has slots.
6. Three supply columns.
7. A "Play a code" input with a Play button and inline validation message.

### Visual language

Bobbin follows the main EllieAtWHL design system
([`../ellieatwhl-design-system/`](../ellieatwhl-design-system/README.md)): the
same colours, fonts, themes and component styles as the rest of the personal
site. It must feel like part of the site, not a separate brand. The
prototype's lavender palette, mustard buttons and Fredoka font are **not**
carried over. Only its layout and the game-specific drawing (stitches,
spools, belt) are.

- **Colour tokens are shared, not copied.** The Vite build imports the site's
  own `src/styles/variables.css`, so Bobbin picks up any palette change and
  can't drift. No hardcoded hex for UI chrome (same rule as the rest of the
  repo: see `reference/CSS_ARCHITECTURE.md`). The page background, ink,
  buttons, focus rings and cards use the main site's green brand tokens for
  light mode and the `--dark-*` tokens for dark mode.
- **Same theme choice as the site.** Light and dark are both first-class. On
  load, Bobbin applies the same logic as `public/theme-script.js`: the
  `theme` localStorage key (`light`/`dark`), falling back to
  `prefers-color-scheme`, applied as the `light`/`dark` class on `<html>`.
  Bobbin is on the same origin, so the visitor's choice on the main site
  carries over. Any theme toggle in Bobbin writes the same key.
- **Font: Nokora**, the site's font (loaded in `src/app/layout.tsx` via
  `next/font/google`). Bobbin can't use Next's hashed font files, so it
  bundles its own copy of Nokora, which also satisfies the CSP's
  `font-src 'self'` and works offline. It's used on canvas too (the spool
  capacity numbers).
- **Component styles** follow `main-theme.css`/the design system: the same
  button shapes and colours, corner radii (12px cards, 8px controls),
  understated borders, and spacing.
- **The yarn palette is gameplay, not chrome.** The 12 yarn colours stay as
  they are (they must stay distinct from each other and readable on the
  board). The board panel behind the stitches is a neutral surface, light in
  both themes, so yarn colours read consistently.
- **Game drawing:** stitches are two tilted ellipses per cell with a soft
  highlight. Collected cells show a faint empty stitch, so the picture looks
  unravelled rather than erased. Bobbins are wooden spools wound in the yarn
  colour, with the capacity in white with a dark outline, drawn on canvas and
  as inline SVG for the DOM rack and columns. Effects: a curved thread flies
  from each collected stitch to its bobbin (~280 ms), and a ring pops where a
  bobbin empties (~360 ms).
- **No main-site navbar.** Bobbin is a standalone installable app, and the
  site navbar's links would leave the PWA's scope. Instead, the header has a
  small link back to the main site. Hide it when running installed
  (`display-mode: standalone`).

**Interaction and feedback**

- Tap targets are real buttons with aria-labels (e.g. "Send red bobbin with
  12"). Dimmed upcoming bobbins aren't focusable.
- Overlays: "Pattern finished" offers a new puzzle at the same difficulty and
  reminds the player of the code. "The rack is full" offers Try again, which
  replays the same code.
- Restart reuses the cached generated puzzle rather than regenerating it. The
  title shows "Knitting..." while a new puzzle generates.
- Respects reduced motion (no moving belt dashes). Keyboard focus is visible.
- Animation interpolates bobbins between belt positions each frame. Drawing
  is wrapped so an error can't stop the animation loop, and layout ignores
  transient near-zero widths.

## Platform and hosting

Bobbin ships as a PWA from this site, installable from Chrome on Android and
fully playable offline after the first visit.

**Requirements**

- Installable: a web app manifest (theme and background colours taken from
  the main site's brand tokens) with `id`, `start_url` and `scope` all
  `/bobbin/`, name and short name, icons (192 and 512 px, plus maskable,
  original art), theme and background colours, `display: standalone`, and
  portrait orientation.
- Offline: a service worker scoped to `/bobbin/` precaches every game asset on
  first visit. The game makes no network requests at runtime.
- Updates: new versions download in the background and apply on next launch,
  optionally with a small "Update ready" prompt.
- Local-only data: anything saved lives on the device (localStorage or
  IndexedDB). Clearing Chrome site data wipes it.

**How it's built and served** (decided; implemented in WEB-195 and WEB-197)

- A Vite + TypeScript app in its own folder in this repo, sharing the repo's
  `node_modules`, lint, typecheck and CI. It doesn't need React or server
  rendering.
- `npm run build` builds it into `public/bobbin/` (gitignored) before
  `next build`, so Vercel deploys both from one push.
- A `next.config.ts` rewrite makes `/bobbin` and `/bobbin/` serve
  `/bobbin/index.html`.
- Why not a native Next.js route like Regicide and Microbrew: offline play
  would mean precaching Next's `/_next/static/` chunks and coordinating with
  the site's root service worker. A static build with its own scoped worker
  avoids both.

### How it fits alongside the site's existing service worker

Investigated in WEB-193:

- **The site's PWA is hand-written** (no `next-pwa` or Serwist).
  `public/sw.js` (WEB-100) is registered by
  `src/components/ServiceWorkerRegistration.tsx` from the **root** layout, in
  production only, with the default scope **`/`**. So it controls every page,
  not just Spurs Women.
- **It only handles navigations**, network-first, falling back to
  `/offline.html`. It doesn't precache or intercept other requests, so it
  won't cache or interfere with Bobbin's files. Pages under `/bobbin/` are
  controlled by Bobbin's own worker instead, because the most specific
  matching scope wins.
- **Clash: cache cleanup.** The root worker's `activate` handler deletes every
  Cache Storage entry not named `offline-fallback-v1`. Cache Storage is shared
  by all workers on the origin, so the next root `sw.js` update would wipe
  Bobbin's precache. Fixed by
  [WEB-194](https://eleanormatthewman.atlassian.net/browse/WEB-194) (each
  worker only deletes caches with its own prefix), which blocks WEB-197.
- **Manifests don't clash.** `public/spurs-women/manifest.webmanifest` sets
  `start_url` and `scope` to `/spurs-women`, with no explicit `id` (so `id`
  defaults to `start_url`). Bobbin uses `/bobbin/` for all three. There's no
  need to narrow the root worker to `/spurs-women/`: it's the site-wide
  offline fallback, not a Spurs-specific worker.
- **`next.config.ts`** has no `trailingSlash`, rewrites or redirects, and
  `src/middleware.ts` only matches admin and profile paths, so nothing
  intercepts `/bobbin/*`. The site-wide security headers do apply. The CSP
  (`script-src 'self'`, `font-src 'self'`, `style-src 'self'`) allows a
  same-origin worker and bundled assets, but would **block Google Fonts**, so
  Nokora must be bundled. Any new runtime network call would need a CSP
  entry, but the game shouldn't make any.

## Architecture

The rules, generator and simulator are pure TypeScript with no DOM access, so
they can be unit tested and shared by the game and the simulated players.

Proposed structure:

```
core/
  rules.ts        belt geometry, lineFirst, exposed, single-tick step
  rng.ts          seeded PRNG (mulberry32) and helpers
  codes.ts        parse, format, random code, version prefix
  palette.ts      yarn colours and names
gen/
  pictures.ts     rings, waves, quilt, sprite, mix
  bobbins.ts      peel, merge, split, scramble, deal
  difficulty.ts   configs per level
  generate.ts     attempt loop, validation, fallback
sim/
  simulate.ts     smart and casual players, win-rate helper
game/
  state.ts        game state machine (play, finishing, won, lost)
  loop.ts         fixed-step ticks + render interpolation
render/
  canvas.ts       belt, board, stitches, bobbins, effects
  ui.ts           rack, supply, header, overlays, code form
pwa/              manifest, icons, service worker config
main.ts
```

**Design rules**

- **One source of truth for a tick.** In the prototype, the tick logic is
  duplicated in `tick()` (game) and `simulate()` (players), and the two
  drifted once (the auto-finish count). Both must call the same `step(state)`,
  with the game layering effects on top.
- A fixed timestep for logic; `requestAnimationFrame` only for drawing and
  interpolation.
- Generation can be slow on a phone (desktop max ~0.6 s), so it runs in a Web
  Worker with the "Knitting..." state showing.
- The whole game must work with no network.

**Testing**

- Determinism: the same code produces an identical grid and bobbin list,
  across runs and after refactors (golden snapshots for a set of codes per
  difficulty).
- Invariants for every generated puzzle: per-colour capacity equals stitch
  count; every capacity is at least 1 and at most the max; the smart player
  can win.
- Rules: belt geometry (entry at bottom-left, clockwise), line-of-sight
  collection, rack-overflow loss, auto-finish counting belt bobbins.
- Calibration report: a script that generates N puzzles per difficulty and
  prints casual and smart win rates, bobbin counts and generation times, like
  the tables above. Run it whenever difficulty changes.

## Assumptions

Made during prototyping without an explicit ruling. Any of them can be
overturned.

| Assumption | Why | Impact if wrong |
|---|---|---|
| A bobbin collects at most one stitch per position per tick | Matches the genre and keeps motion readable | Changes pacing and difficulty numbers |
| Rack bobbins can be sent in any order | Simplest and most forgiving | A queue-style rack would make everything harder |
| 3 supply columns, 2 upcoming bobbins visible per column | Mirrors the genre | Affects planning and difficulty |
| The target device is Android with Chrome | Ellie referenced the Google Play store | iPhone needs extra testing ([WEB-204](https://eleanormatthewman.atlassian.net/browse/WEB-204)) |
| The casual simulated player approximates a real human | Needed a measurable proxy | Difficulty bands may need retuning after playtesting |
| No persistence yet | Not discussed in detail | Stats, streaks or resume need a storage design ([WEB-199](https://eleanormatthewman.atlassian.net/browse/WEB-199)) |

## Open decisions and backlog

Phase 5 tickets. Each one notes the decision it needs from Ellie before work
starts.

| Ticket | Covers | Decision needed |
|---|---|---|
| [WEB-198](https://eleanormatthewman.atlassian.net/browse/WEB-198) | Sound, haptics, wake lock, rack-nearly-full warning, win celebration | Are sound and haptics wanted, and on by default? Is a rack warning wanted? |
| [WEB-199](https://eleanormatthewman.atlassian.net/browse/WEB-199) | Local settings, stats and streaks | What to save: settings, stats, last puzzle, mid-puzzle resume? |
| [WEB-200](https://eleanormatthewman.atlassian.net/browse/WEB-200) | Daily puzzle | Wanted? At which difficulty? |
| [WEB-201](https://eleanormatthewman.atlassian.net/browse/WEB-201) | Retune difficulty from real play; extra mechanics | Is Easy easy enough? Should Medium and Hard get hidden or fewer visible bobbins? |
| [WEB-202](https://eleanormatthewman.atlassian.net/browse/WEB-202) | More picture generators | None |
| [WEB-203](https://eleanormatthewman.atlassian.net/browse/WEB-203) | Colour-blind palette or patterned yarns | None |
| [WEB-204](https://eleanormatthewman.atlassian.net/browse/WEB-204) | iPhone and Safari support | Is the game just for Ellie, or for friends and family too? |

Anything in this list that changes the generator must bump the puzzle-code
version (see [Puzzle codes](#puzzle-codes)).
