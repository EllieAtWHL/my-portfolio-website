// Microbrew game state and pure state transitions. useMicrobrewGame owns the
// state; everything here is a pure function of (state, input) -> new state so
// the rules are testable without React.
//
// Invalid transitions (wrong phase, a card not in hand, ...) throw: the UI only
// ever offers legal choices, so reaching one is a programming error rather
// than something to message the player about.

import {
  COPPER_COLUMNS,
  COPPER_COLUMN_HEIGHT,
  CUSTOMERS,
  PLAYER_COUNT,
  PUBLIC_REPUTATION_CARDS,
  RECIPES,
  REPUTATION_CARDS,
  SECRET_REPUTATION_CARDS_PER_PLAYER,
  SETUP_HOPS_PER_PLAYER,
  STARTING_BREWERS,
  STARTING_CASH,
  MAX_BREWERS,
  TOKEN_COUNTS,
  UPGRADE_TOKENS,
  type BeerColour,
  type Customer,
  type MaltColour,
  type Recipe,
  type ReputationCard,
  type TokenType,
} from './data';
import { deal, shuffle } from './deck';
import { getLegalTargets, isLegalSwap, sameSlot, swapTokens, type Copper, type CopperSlot } from './copper';

export type { Copper, CopperSlot, CopperToken } from './copper';

/**
 * - `returnRecipe`: the second player has drawn an extra recipe and must choose
 *   one to shuffle back into the deck.
 * - `hopSwap`: `currentPlayer` must swap their setup hop into their Copper
 *   (first player, then second).
 * - `playing` / `finished`: the game proper (WEB-181 onwards).
 */
export type GamePhase = 'returnRecipe' | 'hopSwap' | 'playing' | 'finished';

export type PlayerIndex = 0 | 1;

/** Spaces on the Brewmaster's path (Manage -> Flush -> Advertise -> Manage, WEB-184). */
export type BrewmasterSpace = 'manage' | 'flush' | 'advertise';

export interface PlayerState {
  name: string;
  copper: Copper;
  cash: number;
  /** Brewers in the player's Ready Area. */
  readyBrewers: number;
  /** Secret. Only the colour tier (card back) is public - see getRecipeBacks. */
  recipeHand: Recipe[];
  loyalCustomers: Customer[];
  /** Secret reputation cards, scored at game end (WEB-184). */
  reputation: ReputationCard[];
}

export interface BoardState {
  /**
   * The shared token pool. It's a bag: order is meaningless after setup, so
   * later draws (Mash, WEB-183) must draw at random rather than from the front.
   */
  tin: TokenType[];
  customerDeck: Customer[];
  thirstyCustomers: Customer[];
  recipeDeck: Recipe[];
  revealedRecipes: Recipe[];
  /** The shared face-up reputation card. The 2 set-aside cards aren't kept anywhere. */
  publicReputation: ReputationCard;
  brewmaster: BrewmasterSpace;
  /** Near the Manage job: bought via Copper Upgrade and Hire Staff (WEB-183). */
  supply: {
    upgradeTokens: number;
    spareBrewers: [number, number];
  };
}

export interface GameState {
  phase: GamePhase;
  players: [PlayerState, PlayerState];
  firstPlayer: PlayerIndex;
  /** Whose decision the game is waiting on. */
  currentPlayer: PlayerIndex;
  board: BoardState;
  /**
   * A Brew in progress: the current player's moving token has made at least
   * one swap and can still swap again. null when no chain is open.
   */
  brew: BrewState | null;
}

export interface BrewState {
  /** Where the moving token is now. Only this token may keep swapping. */
  slot: CopperSlot;
  swaps: number;
}

const MALTS: MaltColour[] = ['yellow', 'orange', 'brown'];

export const otherPlayer = (player: PlayerIndex): PlayerIndex => (player === 0 ? 1 : 0);

function buildMaltTin(): TokenType[] {
  return MALTS.flatMap((malt) => Array<TokenType>(TOKEN_COUNTS[malt]).fill(malt));
}

/**
 * Blind-draws a full Copper from the front of `tin`: column by column from the
 * left, bottom-up within each column (the order matters for the Brew puzzle).
 */
function fillCopper(tin: TokenType[]): { copper: Copper; tin: TokenType[] } {
  const copper: Copper = [];
  let remaining = tin;
  for (let column = 0; column < COPPER_COLUMNS; column++) {
    const draw = deal(remaining, COPPER_COLUMN_HEIGHT);
    copper.push(draw.dealt);
    remaining = draw.remaining;
  }
  return { copper, tin: remaining };
}

function newPlayer(name: string, copper: Copper): PlayerState {
  return {
    name,
    copper,
    cash: STARTING_CASH,
    readyBrewers: STARTING_BREWERS,
    recipeHand: [],
    loyalCustomers: [],
    reputation: [],
  };
}

/**
 * Deals a new game per the rulebook's Setup section, up to the two
 * player-driven steps (returning a recipe, then the hop swaps).
 *
 * Deviation from the rulebook's order: the first player is chosen before the
 * recipes are dealt, because the recipe step's extra draw goes to the player
 * going second. Random calls happen in this order (tests rely on it): first
 * player, tin shuffle, customer shuffle, recipe shuffle, reputation shuffle.
 */
export function createNewGame(playerOneName: string, playerTwoName: string): GameState {
  const firstPlayer: PlayerIndex = Math.random() < 0.5 ? 0 : 1;
  const secondPlayer = otherPlayer(firstPlayer);

  // Coppers: player one's is drawn first, then player two's.
  const filledOne = fillCopper(shuffle(buildMaltTin()));
  const filledTwo = fillCopper(filledOne.tin);
  const players: [PlayerState, PlayerState] = [
    newPlayer(playerOneName, filledOne.copper),
    newPlayer(playerTwoName, filledTwo.copper),
  ];

  // Customers: 1 loyal each, then 2 thirsty.
  let customerDeck = shuffle(CUSTOMERS);
  for (const player of players) {
    const draw = deal(customerDeck, 1);
    player.loyalCustomers = draw.dealt;
    customerDeck = draw.remaining;
  }
  const thirsty = deal(customerDeck, 2);

  // Recipes: 1 each, reveal 3, then the second player draws 1 extra.
  let recipeDeck = shuffle(RECIPES);
  for (const player of players) {
    const draw = deal(recipeDeck, 1);
    player.recipeHand = draw.dealt;
    recipeDeck = draw.remaining;
  }
  const revealed = deal(recipeDeck, 3);
  const extra = deal(revealed.remaining, 1);
  players[secondPlayer].recipeHand = [...players[secondPlayer].recipeHand, ...extra.dealt];

  // Reputation: 1 public, 2 secret each, the rest set aside unseen.
  const reputation = deal(shuffle(REPUTATION_CARDS), PUBLIC_REPUTATION_CARDS);
  let reputationDeck = reputation.remaining;
  for (const player of players) {
    const draw = deal(reputationDeck, SECRET_REPUTATION_CARDS_PER_PLAYER);
    player.reputation = draw.dealt;
    reputationDeck = draw.remaining;
  }

  return {
    phase: 'returnRecipe',
    players,
    firstPlayer,
    currentPlayer: secondPlayer,
    board: {
      tin: filledTwo.tin,
      customerDeck: thirsty.remaining,
      thirstyCustomers: thirsty.dealt,
      recipeDeck: extra.remaining,
      revealedRecipes: revealed.dealt,
      publicReputation: reputation.dealt[0],
      brewmaster: 'manage',
      supply: {
        upgradeTokens: UPGRADE_TOKENS,
        spareBrewers: [MAX_BREWERS - STARTING_BREWERS, MAX_BREWERS - STARTING_BREWERS],
      },
    },
    brew: null,
  };
}

function assertPhase(game: GameState, phase: GamePhase) {
  if (game.phase !== phase) {
    throw new Error(`Expected phase '${phase}', but the game is in '${game.phase}'`);
  }
}

function updatePlayer(
  players: GameState['players'],
  index: PlayerIndex,
  update: (player: PlayerState) => PlayerState,
): GameState['players'] {
  const next: GameState['players'] = [...players];
  next[index] = update(players[index]);
  return next;
}

/** The second player shuffles one recipe from their hand back into the deck. */
export function returnRecipe(game: GameState, recipeId: string): GameState {
  assertPhase(game, 'returnRecipe');
  const player = game.players[game.currentPlayer];
  const recipe = player.recipeHand.find((card) => card.id === recipeId);
  if (!recipe) {
    throw new Error(`Recipe ${recipeId} is not in ${player.name}'s hand`);
  }

  return {
    ...game,
    phase: 'hopSwap',
    currentPlayer: game.firstPlayer,
    players: updatePlayer(game.players, game.currentPlayer, (p) => ({
      ...p,
      recipeHand: p.recipeHand.filter((card) => card !== recipe),
    })),
    board: { ...game.board, recipeDeck: shuffle([...game.board.recipeDeck, recipe]) },
  };
}

/**
 * The current player replaces the malt at `target` in their own Copper with a
 * hop, returning the malt to the tin. After both players have swapped (first
 * player, then second), the remaining hops go into the tin and play begins.
 */
export function swapSetupHop(game: GameState, target: CopperSlot): GameState {
  assertPhase(game, 'hopSwap');
  const copper = game.players[game.currentPlayer].copper;
  const token = copper[target.column]?.[target.slot];
  if (token === undefined) {
    throw new Error(`No Copper slot at column ${target.column}, slot ${target.slot}`);
  }
  if (token === 'hops' || token === null) {
    throw new Error('The setup hop must replace a malt');
  }

  const players = updatePlayer(game.players, game.currentPlayer, (p) => ({
    ...p,
    copper: p.copper.map((column, c) =>
      c === target.column ? column.map((t, s) => (s === target.slot ? 'hops' : t)) : column,
    ),
  }));
  const tin = [...game.board.tin, token];

  const bothSwapped = game.currentPlayer !== game.firstPlayer;
  if (!bothSwapped) {
    return { ...game, players, currentPlayer: otherPlayer(game.currentPlayer), board: { ...game.board, tin } };
  }

  const remainingHops = TOKEN_COUNTS.hops - SETUP_HOPS_PER_PLAYER * PLAYER_COUNT;
  return {
    ...game,
    phase: 'playing',
    players,
    currentPlayer: game.firstPlayer,
    board: { ...game.board, tin: [...tin, ...Array<TokenType>(remainingHops).fill('hops')] },
  };
}

/**
 * Brew: the current player swaps the token at `from` with its neighbour at
 * `to`. The first swap starts a chain with that token; while the chain is
 * open, only the same token (now at `game.brew.slot`) may keep swapping. The
 * chain closes by itself once the token has no legal swap left, or earlier via
 * endBrew - the player never has to take the longest chain.
 *
 * Worker placement (spending a brewer on Brew) is WEB-181's job; this is just
 * the puzzle.
 */
export function brewSwap(game: GameState, from: CopperSlot, to: CopperSlot): GameState {
  assertPhase(game, 'playing');
  if (game.brew && !sameSlot(game.brew.slot, from)) {
    throw new Error('Only the token already being brewed can keep swapping');
  }
  const current = game.players[game.currentPlayer].copper;
  if (!isLegalSwap(current, from, to)) {
    throw new Error(
      `Illegal Brew swap from column ${from.column} slot ${from.slot} to column ${to.column} slot ${to.slot}`,
    );
  }
  const copper = swapTokens(current, from, to);

  const canContinue = getLegalTargets(copper, to).length > 0;
  return {
    ...game,
    players: updatePlayer(game.players, game.currentPlayer, (p) => ({ ...p, copper })),
    brew: canContinue ? { slot: to, swaps: (game.brew?.swaps ?? 0) + 1 } : null,
  };
}

/** Stops an open Brew chain early. */
export function endBrew(game: GameState): GameState {
  assertPhase(game, 'playing');
  if (!game.brew) {
    throw new Error('There is no Brew in progress to end');
  }
  return { ...game, brew: null };
}

/**
 * The public part of a player's recipe hand: each card's colour tier, which is
 * printed on its back. Anyone may ask to see an opponent's card backs.
 */
export function getRecipeBacks(player: PlayerState): BeerColour[] {
  return player.recipeHand.map((recipe) => recipe.colour);
}
