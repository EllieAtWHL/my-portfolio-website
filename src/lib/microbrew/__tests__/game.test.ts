import {
  createNewGame,
  getRecipeBacks,
  returnRecipe,
  swapSetupHop,
  type GameState,
} from '../game';
import { CUSTOMERS, RECIPES, REPUTATION_CARDS, type TokenType } from '../data';

// ---------------------------------------------------------------------------
// Deterministic shuffle fixture
//
// shuffle() is Fisher-Yates driven by Math.random(). With Math.random() pinned
// to 0, every swap targets index 0, which (worked through by hand, and the
// same as useRegicideGame.test.ts) always rotates the array left by one:
// element 0 moves to the end and everything else shifts down one index.
//
// createNewGame() consumes randomness in this order: first player, tin,
// customers, recipes, reputation. With Math.random() = 0:
//
//   first player: Math.random() < 0.5 -> player one (index 0) goes first,
//     so player two is second and gets the extra recipe draw
//   tin (built yellow x16, orange x16, brown x16), rotated:
//     yellow x15, orange x16, brown x16, yellow
//   player one's Copper = the first 16 draws, column by column, bottom-up:
//     [y,y,y,y] [y,y,y,y] [y,y,y,y] [y,y,y,o]
//   player two's Copper = the next 16:
//     [o,o,o,o] [o,o,o,o] [o,o,o,o] [o,o,o,b]
//   tin left: brown x15, yellow
//   customers (CUSTOMERS order), rotated: india, munich, tokyo, czech, english,
//     russian, belgian, american, scottish, oktoberfest, irish, jamaican
//     loyal: P1 india-pale-ale, P2 munich-dark-lager; thirsty: tokyo, czech
//   recipes, rotated: recipe-02..16, recipe-01
//     hands: P1 [02], P2 [03]; revealed 04, 05, 06; P2's extra draw: 07
//     deck left: 08..16, 01
//   reputation, rotated: reputation-2..7, reputation-1
//     public: 2; P1: 3, 4; P2: 5, 6; set aside: 7, 1
//
// returnRecipe('recipe-07') then reshuffles [08..16, 01, 07] -> [09..16, 01, 07, 08].
// ---------------------------------------------------------------------------

const y: TokenType = 'yellow';
const o: TokenType = 'orange';
const b: TokenType = 'brown';

const ids = (cards: readonly { id: string }[]) => cards.map((card) => card.id);
const count = (tokens: TokenType[], type: TokenType) => tokens.filter((t) => t === type).length;
const recipeIds = (...numbers: number[]) => numbers.map((n) => `recipe-${String(n).padStart(2, '0')}`);

function dealFixtureGame(): GameState {
  jest.spyOn(Math, 'random').mockReturnValue(0);
  return createNewGame('Alice', 'Bob');
}

/** Plays both setup choices: P2 returns recipe-07, then P1 and P2 each swap a middle malt. */
function completeFixtureSetup(): GameState {
  let game = dealFixtureGame();
  game = returnRecipe(game, 'recipe-07');
  game = swapSetupHop(game, { column: 1, slot: 1 });
  return swapSetupHop(game, { column: 2, slot: 1 });
}

describe('createNewGame', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fills each Copper column by column from the left, bottom-up, player one first', () => {
    const game = dealFixtureGame();

    expect(game.players[0].copper).toEqual([
      [y, y, y, y],
      [y, y, y, y],
      [y, y, y, y],
      [y, y, y, o],
    ]);
    expect(game.players[1].copper).toEqual([
      [o, o, o, o],
      [o, o, o, o],
      [o, o, o, o],
      [o, o, o, b],
    ]);
    expect(game.board.tin).toEqual([...Array(15).fill(b), y]);
  });

  it('starts both players on $0 with 2 ready brewers, and stocks the supply', () => {
    const game = dealFixtureGame();

    for (const player of game.players) {
      expect(player.cash).toBe(0);
      expect(player.readyBrewers).toBe(2);
    }
    expect(game.players.map((p) => p.name)).toEqual(['Alice', 'Bob']);
    expect(game.board.supply).toEqual({ upgradeTokens: 2, spareBrewers: [1, 1] });
  });

  it('starts the Brewmaster on Manage', () => {
    expect(dealFixtureGame().board.brewmaster).toBe('manage');
  });

  it('deals 1 loyal customer each and 2 thirsty customers, with no overlap', () => {
    const game = dealFixtureGame();

    expect(ids(game.players[0].loyalCustomers)).toEqual(['india-pale-ale']);
    expect(ids(game.players[1].loyalCustomers)).toEqual(['munich-dark-lager']);
    expect(ids(game.board.thirstyCustomers)).toEqual(['tokyo-extra-dry-lager', 'czech-pilsner']);
    expect(game.board.customerDeck).toHaveLength(8);

    const allCustomers = [
      ...game.players.flatMap((p) => ids(p.loyalCustomers)),
      ...ids(game.board.thirstyCustomers),
      ...ids(game.board.customerDeck),
    ];
    expect(new Set(allCustomers).size).toBe(CUSTOMERS.length);
  });

  it('deals 1 recipe each, reveals 3, and gives the second player an extra draw', () => {
    const game = dealFixtureGame();

    expect(ids(game.players[0].recipeHand)).toEqual(recipeIds(2));
    expect(ids(game.players[1].recipeHand)).toEqual(recipeIds(3, 7));
    expect(ids(game.board.revealedRecipes)).toEqual(recipeIds(4, 5, 6));
    expect(ids(game.board.recipeDeck)).toEqual(recipeIds(8, 9, 10, 11, 12, 13, 14, 15, 16, 1));
  });

  it('deals 1 public and 2 secret reputation cards each, and keeps the other 2 out of state', () => {
    const game = dealFixtureGame();

    expect(game.board.publicReputation.id).toBe('reputation-2');
    expect(ids(game.players[0].reputation)).toEqual(['reputation-3', 'reputation-4']);
    expect(ids(game.players[1].reputation)).toEqual(['reputation-5', 'reputation-6']);

    const serialised = JSON.stringify(game);
    expect(serialised).not.toContain('reputation-7');
    expect(serialised).not.toContain('reputation-1"');
    expect(REPUTATION_CARDS).toHaveLength(7);
  });

  it('waits on the second player to return a recipe', () => {
    const game = dealFixtureGame();

    expect(game.firstPlayer).toBe(0);
    expect(game.phase).toBe('returnRecipe');
    expect(game.currentPlayer).toBe(1);
  });

  it('gives player two the first turn when the random pick goes their way', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValue(0);
    const game = createNewGame('Alice', 'Bob');

    expect(game.firstPlayer).toBe(1);
    // Player one now goes second, so they get the extra recipe and return one.
    expect(game.currentPlayer).toBe(0);
    expect(game.players[0].recipeHand).toHaveLength(2);
    expect(game.players[1].recipeHand).toHaveLength(1);
  });

  it('never loses or duplicates a card or token', () => {
    const game = dealFixtureGame();
    const tokens = [...game.players.flatMap((p) => p.copper.flat()), ...game.board.tin];
    const recipes = [
      ...game.players.flatMap((p) => ids(p.recipeHand)),
      ...ids(game.board.revealedRecipes),
      ...ids(game.board.recipeDeck),
    ];

    expect(tokens).toHaveLength(48);
    expect([y, o, b].map((malt) => count(tokens, malt))).toEqual([16, 16, 16]);
    expect(new Set(recipes).size).toBe(RECIPES.length);
    expect(recipes).toHaveLength(RECIPES.length);
  });
});

describe('returnRecipe', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shuffles the chosen card back into the deck, leaving a hand of 1', () => {
    const game = returnRecipe(dealFixtureGame(), 'recipe-07');

    expect(ids(game.players[1].recipeHand)).toEqual(recipeIds(3));
    expect(ids(game.board.recipeDeck)).toEqual(recipeIds(9, 10, 11, 12, 13, 14, 15, 16, 1, 7, 8));
    expect(ids(game.board.revealedRecipes)).toEqual(recipeIds(4, 5, 6));
  });

  it("lets the player return the card they were dealt instead of the extra one", () => {
    const game = returnRecipe(dealFixtureGame(), 'recipe-03');
    expect(ids(game.players[1].recipeHand)).toEqual(recipeIds(7));
  });

  it('moves on to the first player’s hop swap', () => {
    const game = returnRecipe(dealFixtureGame(), 'recipe-07');

    expect(game.phase).toBe('hopSwap');
    expect(game.currentPlayer).toBe(0);
  });

  it('rejects a recipe that is not in the hand', () => {
    expect(() => returnRecipe(dealFixtureGame(), 'recipe-04')).toThrow(/not in Bob's hand/);
  });

  it('rejects being called outside the returnRecipe phase', () => {
    const game = returnRecipe(dealFixtureGame(), 'recipe-07');
    expect(() => returnRecipe(game, 'recipe-03')).toThrow(/Expected phase 'returnRecipe'/);
  });
});

describe('swapSetupHop', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("replaces the chosen malt in the current player's Copper and returns it to the tin", () => {
    const game = swapSetupHop(returnRecipe(dealFixtureGame(), 'recipe-07'), { column: 3, slot: 3 });

    expect(game.players[0].copper[3]).toEqual([y, y, y, 'hops']);
    expect(game.players[1].copper[3]).toEqual([o, o, o, b]);
    expect(game.board.tin).toEqual([...Array(15).fill(b), y, o]);
    expect(game.phase).toBe('hopSwap');
    expect(game.currentPlayer).toBe(1);
  });

  it('starts play once both players have swapped, with the remaining 4 hops in the tin', () => {
    const game = completeFixtureSetup();

    expect(game.players[0].copper[1]).toEqual([y, 'hops', y, y]);
    expect(game.players[1].copper[2]).toEqual([o, 'hops', o, o]);
    expect(game.phase).toBe('playing');
    expect(game.currentPlayer).toBe(0);
    // 16 undealt malts + the 2 displaced malts + the 4 remaining hops.
    expect(game.board.tin).toHaveLength(22);
    expect([y, o, b, 'hops'].map((t) => count(game.board.tin, t as TokenType))).toEqual([2, 1, 15, 4]);
  });

  it('runs the swaps in turn order when player two goes first', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValue(0);
    let game = createNewGame('Alice', 'Bob');
    game = returnRecipe(game, game.players[0].recipeHand[0].id);

    expect(game.currentPlayer).toBe(1);
    game = swapSetupHop(game, { column: 0, slot: 0 });
    expect(game.currentPlayer).toBe(0);
    game = swapSetupHop(game, { column: 0, slot: 0 });
    expect(game.phase).toBe('playing');
    expect(game.currentPlayer).toBe(1);
  });

  it('rejects a slot outside the Copper', () => {
    const game = returnRecipe(dealFixtureGame(), 'recipe-07');
    expect(() => swapSetupHop(game, { column: 4, slot: 0 })).toThrow(/No Copper slot/);
    expect(() => swapSetupHop(game, { column: 0, slot: 4 })).toThrow(/No Copper slot/);
  });

  it('rejects swapping onto a hop', () => {
    const game = { ...returnRecipe(dealFixtureGame(), 'recipe-07') };
    game.players = [{ ...game.players[0], copper: [['hops', y, y, y], ...game.players[0].copper.slice(1)] }, game.players[1]];
    expect(() => swapSetupHop(game, { column: 0, slot: 0 })).toThrow(/must replace a malt/);
  });

  it('rejects being called before the recipe has been returned', () => {
    expect(() => swapSetupHop(dealFixtureGame(), { column: 0, slot: 0 })).toThrow(/Expected phase 'hopSwap'/);
  });
});

describe('getRecipeBacks', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("exposes only the colour tier of each card in a player's hand", () => {
    const game = dealFixtureGame();

    // recipe-03 is dark, recipe-07 is light (see RECIPES).
    expect(getRecipeBacks(game.players[1])).toEqual(['dark', 'light']);
    expect(getRecipeBacks(game.players[0])).toEqual(['medium']);
  });
});
