# Microbrew

An unofficial digital port of [Microbrew](https://www.onefreeelephant.co.uk/Microbrew/)
(One Free Elephant, Kickstarted May 2019; designed by Nigel and Sarah
Kennington) - a 2-player worker-placement / sliding-token puzzle hybrid where
rival breweries mash malt, arrange their Copper, bottle and ferment beer, and
serve it to customers for cash and reputation. Lives at `/microbrew` in the
personal-site section. Tracked under epic
[WEB-1](https://eleanormatthewman.atlassian.net/browse/WEB-1).

**Status: scaffolding only** ([WEB-178](https://eleanormatthewman.atlassian.net/browse/WEB-178)).
The route, landing screen, static card/token data and hook skeleton exist; no
dealing or game logic yet. The Play button is disabled with a "Coming soon"
note until the hook is wired up. MVP scope is 2-player local hot-seat only.

It follows the same shape as Regicide (see [`../regicide/README.md`](../regicide/README.md)):
one route, one top-level screen switch, screen components in a folder, and one
hook owning all game state and actions.

## Attribution

This is someone else's commercial game. The landing screen must keep crediting
One Free Elephant and the designers, say the port is unofficial and not for
sale, and link to the publisher's page to print-and-play or buy the physical
game. Don't use the game's box art/logo as a primary design element or share
image - that would make the page read as official.

## Files

| File | Responsibility |
|---|---|
| `src/app/microbrew/page.tsx` | Route + metadata. No OG/Twitter share image yet - add `public/microbrew/microbrew.png` (a gameplay screenshot, like Regicide's) once there's a play area - tracked in [WEB-189](https://eleanormatthewman.atlassian.net/browse/WEB-189) |
| `src/components/MicrobrewGame.tsx` | Top-level `'start' \| 'playing'` screen switch; not yet wired to the hook |
| `src/components/microbrew/GameStart.tsx` | Landing screen: title, tagline, description, attribution/buy link, Play button (disabled until `onStartGame` is passed) |
| `src/lib/microbrew/data.ts` | Typed static data: tokens, 12 customers, 16 recipes, 7 reputation cards, component counts |
| `src/lib/microbrew/deck.ts` | Pure `shuffle` (Fisher-Yates, matching the prototype) and `deal` helpers |
| `src/hooks/useMicrobrewGame.ts` | Hook skeleton: `GameState` / `PlayerState` / `BoardState` interfaces and a stub `startGame`. The full field list is settled in WEB-179 |

## Data notes

- The static data was checked card by card against the printed card sheets.
  Where the old vanilla-JS prototype (`myPortfolioWebsite`, `microbrew`
  branch) disagreed, the cards won: orange x4 pays Perfect $6 / Rough $3, and
  brown x4 / yellow x4 pay Perfect $7.
- The yellow/orange/orange/brown recipe prints Perfect struck through (no
  customer drinks it), so it pays $3 at every tier and carries
  `perfectStruckThrough: true`. A data test enforces that this flag matches
  "no customer drinks this combination" exactly.
- Flavours are `spicy`, `malty`, `sweet`. `hops` only ever means the green hop
  token; the prototype's `hops` flavour was a misnaming of `malty`.
- Duplicate recipe cards get distinct ids (`recipe-10`/`recipe-11` etc.) so
  they can be told apart once dealt.
- Players start with $0 (max $49, from the two-cube cash track), not the
  prototype's $2.
