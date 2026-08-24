# Regicide

A web port of [Regicide](https://www.badgersfrommars.com/regicide/) (Badgers
From Mars, 2020) - a cooperative-against-the-deck card game played with a
standard 52-card deck. Lives at `/regicide` as part of the personal-site
section (see root `CLAUDE.md` on the two-sections split), not Spurs Women.

The game engine was fully rewritten in [WEB-77](https://eleanormatthewman.atlassian.net/browse/WEB-77)
against the real rules (a prior AI-generated port had the wrong damage math
and was missing suits, jesters, the defend phase and combos entirely), then
the UI went through an extensive visual/layout polish pass to faithfully
match - and in places improve on - the original vanilla-JS implementation
(`myPortfolioWebsite/regicide/` in the sibling repo, kept around purely as a
visual/behavioural reference, not built or deployed). Tracked under epic
[WEB-32](https://eleanormatthewman.atlassian.net/browse/WEB-32).

## Rules reference

`reference/regicide/RegicideRulesA4.pdf` is the official rules PDF. There is
no in-app rules reference yet - [WEB-78](https://eleanormatthewman.atlassian.net/browse/WEB-78)
tracks adding one.

## Route & top-level structure

- `src/app/regicide/page.tsx` - route, metadata, wraps `RegicideGame` in the
  shared `.content-with-footer` / `.scrollable` layout classes (see
  `CSS_ARCHITECTURE.md`)
- `src/components/RegicideGame.tsx` - top-level state machine: switches
  between `'start' | 'playing' | 'stats'` screens and wires `useRegicideGame`'s
  actions through to whichever screen is active

## Component map

| Component | Responsibility |
|---|---|
| `regicide/GameStart.tsx` | Landing screen: title, Play button, links to buy the physical game / learn the rules, roadmap, version history |
| `regicide/PlayArea.tsx` | The active game screen - royals/tavern/hand layout, game-over banner, wires toasts to `gameData.message` |
| `regicide/Card.tsx` | A single playing card face - traditional pip layout for 2-10, dedicated face art for J/Q/K, big suit icon for A (see "Card faces" below) |
| `regicide/Deck.tsx` | A card-back pile (royal deck / tavern draw pile), shows a count badge |
| `regicide/GameControls.tsx` | Attack / Use Jester / Undo buttons |
| `regicide/GameOverModal.tsx` | The win/lose overlay shown when `gameData.gameOver` is true - a portal-rendered dialog (not a card in the page flow, to avoid reintroducing forced scroll) offering Play Again / View Stats, dismissible via its close button, backdrop click, or Escape |
| `regicide/StatsIconButton.tsx` | The small stats-icon trigger (deliberately not the shared `Button` component - restores the original site's low-opacity icon-only look) |
| `regicide/StatsScreen.tsx` | Modal showing games started/won/lost, win rate, last played |
| `regicide/Toast.tsx` / `regicide/ToastContainer.tsx` | The stacking, auto-dismissing notification system (see "Toasts" below) |

## Game engine (`src/hooks/useRegicideGame.ts`)

`useRegicideGame()` is a single hook owning all game state (`GameData`) plus
the action functions (`startGame`, `selectHandCard`, `attack`, `useJester`,
`undo`) and stats persistence (`loadStats`/`saveStats`/`winGame`/`loseGame`).
No Redux/Zustand/context - this hook is only ever used once, at the
`RegicideGame` level.

**Rules implemented**, matching the physical game:

- Royal deck: J → Q → K per suit, shuffled within each rank tier
  (`J: 10 attack/20 health`, `Q: 15/30`, `K: 20/40`)
- Suit powers, blocked when the played card's suit matches the current
  royal's suit (`SUIT_POWER_LABEL`): ♠ shields against the counter-attack,
  ♥ heals cards back from the discard pile, ♣ doubles damage, ♦ draws cards
- Same-rank combos (`isValidSelection`/`SET_LIMITS`): 2s in groups of up to 4,
  3s up to 3, 4s up to 2, as long as the combined value stays ≤ 10; Aces only
  pair with other Aces
- Defend phase: a surviving royal counter-attacks for its (shield-reduced)
  attack value; the player must discard cards worth at least that much
  before attacking again
- 2 jesters per game (`TOTAL_JESTERS`) - discards the whole hand and deals a
  fresh one from the tavern deck. This is correct even when used during the
  defend phase (it does *not* clear the outstanding defend obligation -
  confirmed against the rulebook's dedicated **Solo Play** section:
  "Discard your hand and refill to 8 cards... You are allowed to use the
  Jester power a) at the start of Step 1 before you play a card or b) at
  the start of Step 4 **before you have to take damage**" - a pure hand
  refill, not a way to cancel or reduce incoming damage. Solo play swaps
  the Jester's power entirely; the multiplayer version instead cancels the
  current enemy's suit immunity, which isn't implemented here since this is
  solo-only)
- Undo: a full move-stack (`history`), not just the last action
- Win: the royal deck is emptied. Loss: `checkHandExhausted` - hand and
  jesters both hit zero. Called after every hand-emptying action, including
  `useJester` (a WEB-77 follow-up fix - previously `useJester` could deal an
  empty hand with no jesters left, undetected, if the tavern deck ever ran
  out; empirically near-impossible to hit with the standard 52-card/2-jester
  economy, but the fix is correct defensive coverage regardless)

**State shape**: see the `GameData` interface at the top of the file -
`phase: 'attack' | 'defend'`, `royalCard`/`royalDeck`, `tavernDeck`,
`playerHand`, `chosenCards` (mid-selection), `activeDeck` (already
committed this fight), `discardPile`, `jestersRemaining`,
`defenceRemaining`, `message` (drives toasts - see below), `gameOver`/
`victory`.

**Stats persistence**: `localStorage['regicide-stats']` -
`{ gamesStarted, gamesWon, gamesLost, lastPlayed }`. No `totalPlayTime` -
removed as dead code (was never incremented); see
[WEB-105](https://eleanormatthewman.atlassian.net/browse/WEB-105) for
reintroducing it properly.

## Card faces

`Card.tsx` faithfully recreates the original site's traditional pip layout
(`PIP_LAYOUTS`, keyed by rank) rather than a generic "big number" card -
each numbered card 2-10 repeats its suit symbol in the classic arrangement,
rotated 180° for the bottom half. J/Q/K use the original's dedicated face
art (`public/regicide/{jack,queen,king}-{red,black}.svg`); A uses one large
suit icon. Corner rank/suit markers are mirrored top-left and bottom-right.
Sizing (112×160px, `w-28 h-40`) was deliberately enlarged from the
original's smaller cards for on-screen legibility at this component's fixed
size - not yet responsive/viewport-relative (see WEB-106).

Both deck types (`Deck.tsx`) share one traditional diamond-lattice card
back in the site's green brand palette rather than a colour per pile, since
Regicide is played with one physical 52-card deck.

## Toasts

`useToasts` + `Toast`/`ToastContainer` port the original vanilla-JS
`Toast` class (`myPortfolioWebsite/scripts/toast.js`): a fixed top-right
stack of independently auto-dismissing (3s), click-to-dismiss notifications
with a depleting progress bar, rather than a single overwritten status
message. `PlayArea` watches `gameData.message` and splits it on `' · '`
back into individual stacked toasts, since the hook joins multiple
sub-events (e.g. a blocked suit power plus the attack itself) into one
string - the hook's contract didn't need to change for this.

## Styling notes

- No emoji anywhere in this section's UI chrome - monochrome stroke SVG
  icons throughout (`viewBox="0 0 24 24"`, `strokeWidth={2}`), matching the
  site-wide convention
- Dark mode uses the site's own green palette (`dark-bg-1`/`dark-accent`
  etc., exposed via `@theme` in `globals.css`) rather than Tailwind's
  default gray scale
- The desktop play area was deliberately tightened to fit a common laptop
  viewport (1249×951 tested) with zero forced scroll - see git history on
  `PlayArea.tsx` for the iterative spacing/margin passes. Mobile is not yet
  similarly tightened (WEB-106)
- Fixed a real Tailwind v4 gotcha along the way: `translate-y-*` utilities
  set the modern standalone `translate` CSS property, which does **not**
  override a legacy `transform: translateY()` rule (like `.button:hover` in
  `main-theme.css`) - they're separate properties that compose rather than
  compete. Use an arbitrary property (`[transform:none]`) to override
  `transform` specifically when that's what needs cancelling

## Known gaps

- No dedicated Playwright E2E spec under `tests/` yet - covered by the Jest
  suite below plus manual play-testing during development

## Roadmap

`GameStart.tsx`'s "Game Roadmap" list (carried over from the original site)
has a Jira ticket per line, all under epic
[WEB-32](https://eleanormatthewman.atlassian.net/browse/WEB-32):

| Roadmap item | Ticket |
|---|---|
| Make more mobile-friendly | [WEB-106](https://eleanormatthewman.atlassian.net/browse/WEB-106) |
| Improve accessibility | [WEB-107](https://eleanormatthewman.atlassian.net/browse/WEB-107) |
| Include a way of teaching new players how to play | [WEB-78](https://eleanormatthewman.atlassian.net/browse/WEB-78) |
| Option to restart (with same starting cards) | [WEB-108](https://eleanormatthewman.atlassian.net/browse/WEB-108) |
| Resign option | [WEB-109](https://eleanormatthewman.atlassian.net/browse/WEB-109) |
| Multi-player support | [WEB-110](https://eleanormatthewman.atlassian.net/browse/WEB-110) |

Plus, not on the roadmap list itself but tracked the same way:
[WEB-105](https://eleanormatthewman.atlassian.net/browse/WEB-105) (total
play time stat, removed as dead code during the WEB-77 rebuild - see
above).

## Testing

`useRegicideGame.ts` is the deep, mutation-tested reference example called
out in `reference/testing/README.md` - scripted turns against a
deterministic shuffle fixture (`Math.random` pinned to `0`, worked through
by hand in the test file's header comment) rather than mocking the RNG
output directly. `Card.tsx`, `Toast.tsx`, `ToastContainer.tsx`, and
`useToasts.ts` have their own component/hook test suites under
`src/components/regicide/__tests__/` and `src/hooks/__tests__/`.
