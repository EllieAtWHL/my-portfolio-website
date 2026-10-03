# Microbrew

An unofficial digital port of [Microbrew](https://www.onefreeelephant.co.uk/Microbrew/)
(One Free Elephant, Kickstarted May 2019; designed by Nigel and Sarah
Kennington) - a 2-player worker-placement / sliding-token puzzle hybrid where
rival breweries mash malt, arrange their Copper, bottle and ferment beer, and
serve it to customers for cash and reputation. Lives at `/microbrew` in the
personal-site section. Tracked under epic
[WEB-1](https://eleanormatthewman.atlassian.net/browse/WEB-1).

**Status: setup and Brew.** Scaffolding and data landed in
[WEB-178](https://eleanormatthewman.atlassian.net/browse/WEB-178); dealing a
new game and the two setup choices (returning a recipe, the hop swaps) in
[WEB-179](https://eleanormatthewman.atlassian.net/browse/WEB-179); the Copper
board and the Brew puzzle in
[WEB-180](https://eleanormatthewman.atlassian.net/browse/WEB-180). Turns and
worker placement aren't playable yet (WEB-181), so the first player can brew
repeatedly. MVP scope is 2-player local hot-seat only.

It follows the same shape as Regicide (see [`../regicide/README.md`](../regicide/README.md)):
one route, one top-level screen switch, screen components in a folder, and one
hook owning all game state and actions. One difference: the rules live as pure
functions in `src/lib/microbrew/game.ts` rather than inside the hook, because
Microbrew's rules are much larger and are easier to test without React.

## Not playable on the live site yet

The game ships ticket by ticket, so `/microbrew` is only playable outside
production. `isMicrobrewPlayable()` (`src/lib/microbrew/availability.ts`) is
read by the server-rendered page and passed down as a `playable` prop:

| Where | Playable? |
|---|---|
| Production (`VERCEL_ENV=production`) | No - Play is disabled with "Coming soon" |
| Vercel PR previews (`VERCEL_ENV=preview`) | Yes - test each ticket from its PR's preview URL |
| Local `npm run dev` (no `VERCEL_ENV`) | Yes |

To launch, set `MICROBREW_ENABLED=true` in the Vercel **production**
environment and redeploy. No code change is needed. The page is statically
rendered, so the flag is read at build time.

## Attribution

This is someone else's commercial game. The landing screen must keep crediting
One Free Elephant and the designers, say the port is unofficial and not for
sale, and link to the publisher's page to print-and-play or buy the physical
game. Don't use the game's box art/logo as a primary design element or share
image - that would make the page read as official.

## Files

| File | Responsibility |
|---|---|
| `src/app/microbrew/page.tsx` | Route + metadata; passes `playable` down. No OG/Twitter share image yet - add `public/microbrew/microbrew.png` (a gameplay screenshot, like Regicide's) once there's a play area - tracked in [WEB-189](https://eleanormatthewman.atlassian.net/browse/WEB-189) |
| `src/components/MicrobrewGame.tsx` | Top-level screen switch: `GameStart` with no game, `GameScreen` once one is dealt |
| `src/components/microbrew/GameStart.tsx` | Landing screen: title, description, attribution/buy link, player name inputs and Play (disabled with "Coming soon" when `onStartGame` isn't passed) |
| `src/components/microbrew/GameScreen.tsx` | The in-game screen: an action panel for whatever the game is waiting on (the hidden-hand recipe return, the hop swaps, Brew), both players' breweries and the shared table. The **current player's own Copper** is the interactive board. The cards and summaries are still plain placeholders |
| `src/components/microbrew/Copper.tsx` | The Copper board: hexagonal tokens (lettered Y/O/B/H so they don't rely on colour alone) on the staggered layout, with the diagonal swap lines drawn in an SVG underneath. Tokens are absolutely positioned buttons, driven by `onSlotClick` / `isSlotEnabled` / `selectedSlot` / `targetSlots`. While a token is picked, everything except it and its legal targets is muted |
| `src/lib/microbrew/data.ts` | Typed static data: tokens, 12 customers, 16 recipes, 7 reputation cards, Copper size, component counts |
| `src/lib/microbrew/copper.ts` | The Copper as pure functions: `Copper`/`CopperSlot` types, `slotHeight`, `getNeighbours`, `isLegalSwap`, `getLegalTargets`, `swapTokens` |
| `src/lib/microbrew/deck.ts` | Pure `shuffle` (Fisher-Yates, matching the prototype) and `deal` helpers |
| `src/lib/microbrew/game.ts` | `GameState` types and pure transitions: `createNewGame`, `returnRecipe`, `swapSetupHop`, `brewSwap`, `endBrew`, plus `getRecipeBacks` |
| `src/lib/microbrew/availability.ts` | `isMicrobrewPlayable()` - see above |
| `src/hooks/useMicrobrewGame.ts` | Owns the `GameState` and exposes `startGame`, `resetGame`, `returnRecipe`, `swapSetupHop`, `brewSwap`, `endBrew` and the public `recipeBacks` |

## Game state

- **Copper:** `(TokenType | null)[][]` - 4 columns, each ordered bottom
  (index 0) to top; `null` is an empty slot (after a Bottle, until a Mash
  refills it). See "The Copper and Brew" below for the layout. The 5th "side
  tank" column comes with the Copper Upgrade (WEB-183).
- **`brew`:** an open Brew chain (`{ slot, swaps }`: where the moving token is
  now, and how many swaps it has made), or `null`.
- **Phases:** `returnRecipe` -> `hopSwap` (first player, then second) ->
  `playing` -> `finished`. `currentPlayer` is whoever the game is waiting on.
- **The tin** is a bag. After setup its order is meaningless, so later draws
  (Mash, WEB-183) must draw at random, not from the front.
- **Secret vs public:** recipe hands and each player's 2 reputation cards are
  secret. A recipe's colour tier is printed on its back, so `getRecipeBacks`
  (and the hook's `recipeBacks`) expose just that. The 2 unused reputation
  cards are dropped at setup and never appear in state.
- Invalid transitions (wrong phase, a card not in hand, swapping onto a hop,
  an illegal Brew swap) throw, because the UI only ever offers legal choices.

## Setup (`createNewGame`)

Follows the rulebook's Setup section with one digital-only change: the first
player is chosen **before** recipes are dealt, because the recipe step's extra
draw goes to the player going second.

1. Both players start on $0 with 2 ready brewers. The supply holds each
   player's 3rd brewer and the 2 Upgrade tokens. The Brewmaster starts on
   Manage.
2. The 48 malts are shuffled into the tin. Player one's Copper is drawn first,
   then player two's, each column by column from the left and bottom-up within
   a column (the order matters for the Brew puzzle). 16 malts stay in the tin.
3. Customers: 1 loyal each, then 2 thirsty; 8 left in the deck.
4. Recipes: 1 each, 3 revealed, then the second player draws an extra and
   **chooses** one to shuffle back (`returnRecipe`).
5. Reputation: 1 public, 2 secret each, 2 set aside unseen.
6. Each player, first player first, **chooses** a malt to replace with a hop
   (`swapSetupHop`); the malt goes back to the tin. After both, the other 4
   hops join the tin (16 + 2 + 4 = 22 tokens) and play begins.

Randomness is consumed in a fixed order - first player, tin, customers,
recipes, reputation - which the tests depend on.

## The Copper and Brew (`copper.ts`, `brewSwap`)

Checked against the rulebook's Brew section and its two worked examples
(rules p.13-14), which the tests reproduce.

**Layout.** The Copper isn't a square grid. Columns 1 and 3 (indices 0 and 2,
and the side tank at index 4) sit half a slot higher than columns 2 and 4.
Slots are joined only by **diagonal** lines between adjacent columns: no
vertical or horizontal lines. With `slotHeight = 2 * slot (+1 in a raised
column)`, two slots are neighbours exactly when their columns differ by 1 and
their heights by 1, so a slot has up to 4 neighbours. Adjacency is derived from
the Copper's own column count, so adding the side tank column (WEB-183) needs
no change here.

**Swap rules** (`isLegalSwap`), judged from the moving token's point of view:

- neither slot may be empty, and the target must be a diagonal neighbour;
- a hop can swap with anything, and anything can swap with a hop;
- a malt moving **up** must swap with a **darker** malt, and moving **down**
  with a **lighter** one (yellow < orange < brown), so equal shades never swap.

**Chains.** The first `brewSwap` starts a chain with the picked token. While
`game.brew` is open, only that token (now at `brew.slot`) may keep swapping. The
chain closes by itself when the token has no legal swap left, or earlier via
`endBrew`: the player never has to take the longest chain. There's deliberately
no limit on revisiting slots: a hop can always swap, so a hop's chain only
ends via `endBrew`, and the rulebook's tips recommend "power moves" moving a hop
in a circular path. A token picked but
not yet swapped is UI-only state in `GameScreen`, so it can be changed or
cancelled freely. Spending a brewer on Brew is WEB-181's job.

## Testing

`src/lib/microbrew/__tests__/game.test.ts` pins `Math.random` to `0` (every
Fisher-Yates swap then rotates the array left by one, as in Regicide's tests)
and works the whole expected deal through by hand in its header comment, so
the assertions check exact cards and tokens rather than random output. Both
first-player branches are covered with `mockReturnValueOnce`.
`copper.test.ts` builds small Coppers from strings (`'YOBH.'` per column,
bottom-up) to cover adjacency (corner, edge, interior, side tank), every swap
rule, the rulebook's single-swap example and a multi-step chain. The hook,
`GameStart` and `MicrobrewGame` (setup plus picking, chaining and ending a
Brew) have lighter tests on top.

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
