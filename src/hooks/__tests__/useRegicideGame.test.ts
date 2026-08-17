import { renderHook, act } from '@testing-library/react';
import { useRegicideGame, isValidSelection, cardValue, type PlayingCard } from '../useRegicideGame';

// ---------------------------------------------------------------------------
// Deterministic shuffle fixture
//
// shuffle() (internal) drives a Fisher-Yates shuffle off Math.random(). With
// Math.random() pinned to 0, every swap targets index 0 - which, worked
// through the algorithm by hand, always produces "rotate the array left by
// one" (element 0 moves to the end, everything else shifts down one index).
// This was verified against the hook's actual output, not assumed.
//
// startGame() shuffles jacks, queens and kings separately (each built in
// suit order hearts, diamonds, clubs, spades) and concatenates
// jacks+queens+kings; it separately shuffles the 40-card tavern deck (built
// in the same suit order, ranks A,2..10 per suit - J/Q/K are royals, not
// tavern cards). Rotating each left by one:
//   jacks  [hearts,diamonds,clubs,spades]-J -> [diamonds,clubs,spades,hearts]-J
//   queens/kings: same pattern
//   royalDeck (front = next fought) = diamonds-J, clubs-J, spades-J, hearts-J,
//     diamonds-Q, clubs-Q, spades-Q, hearts-Q, diamonds-K, clubs-K, spades-K, hearts-K
//   first royalCard (popped from front): diamonds-J (attack 10, health 20)
//   tavern, rotated: hearts-2..10, diamonds-A..10, clubs-A..10, spades-A..10, hearts-A
//   initial 8-card hand (front of tavern): hearts-2,3,4,5,6,7,8,9
//   remaining 32-card tavernDeck starts: hearts-10, diamonds-A..10, clubs-A..10, spades-A..10, hearts-A
// ---------------------------------------------------------------------------

function dealFixtureGame() {
  jest.spyOn(Math, 'random').mockReturnValue(0);
  const rendered = renderHook(() => useRegicideGame());
  act(() => rendered.result.current.startGame());
  return rendered;
}

const cardLabel = (card: PlayingCard) => `${card.suit}-${card.rank}`;
const card = (suit: PlayingCard['suit'], rank: PlayingCard['rank']): PlayingCard => ({ suit, rank });

describe('useRegicideGame', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  describe('initializeGame', () => {
    it('starts with isLoading true and an empty, not-playing game before anything runs', () => {
      const { result } = renderHook(() => useRegicideGame());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.gameData.isPlaying).toBe(false);
      expect(result.current.gameData.royalCard).toBeNull();
      expect(result.current.gameData.playerHand).toEqual([]);
    });

    it('resets an in-progress game back to the default state and clears isLoading and undo history', () => {
      const { result } = dealFixtureGame();
      expect(result.current.gameData.isPlaying).toBe(true);

      act(() => result.current.initializeGame());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.gameData.isPlaying).toBe(false);
      expect(result.current.gameData.royalCard).toBeNull();
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('startGame', () => {
    it('deals an 8-card hand and fights jacks before queens before kings', () => {
      const { result } = dealFixtureGame();

      const { gameData } = result.current;
      expect(gameData.isPlaying).toBe(true);
      expect(gameData.gameOver).toBe(false);
      expect(gameData.phase).toBe('attack');
      expect(gameData.jestersRemaining).toBe(2);
      expect(gameData.discardPile).toEqual([]);

      expect(gameData.royalCard).toEqual({
        suit: 'diamonds',
        rank: 'J',
        attack: 10,
        maxAttack: 10,
        health: 20,
        maxHealth: 20,
      });
      expect(gameData.royalDeck.map(cardLabel)).toEqual([
        'clubs-J',
        'spades-J',
        'hearts-J',
        'diamonds-Q',
        'clubs-Q',
        'spades-Q',
        'hearts-Q',
        'diamonds-K',
        'clubs-K',
        'spades-K',
        'hearts-K',
      ]);
      expect(gameData.playerHand.map(cardLabel)).toEqual([
        'hearts-2',
        'hearts-3',
        'hearts-4',
        'hearts-5',
        'hearts-6',
        'hearts-7',
        'hearts-8',
        'hearts-9',
      ]);
      // 52-card deck minus 12 royals (40) minus the 8-card starting hand
      expect(gameData.tavernDeck).toHaveLength(32);
    });

    it('deals a full, unmodified set of cards (nothing missing or duplicated)', () => {
      const { result } = dealFixtureGame();

      const { gameData } = result.current;
      const dealt = [...gameData.playerHand, ...gameData.tavernDeck, ...gameData.royalDeck, gameData.royalCard!]
        .map(cardLabel)
        .sort();
      expect(dealt).toHaveLength(52);
      expect(new Set(dealt).size).toBe(52);
    });

    it('starting a second game fully replaces the previous game state and clears undo history', () => {
      const { result } = dealFixtureGame();
      act(() => result.current.selectHandCard(0));
      expect(result.current.canUndo).toBe(true);

      act(() => result.current.startGame());

      expect(result.current.gameData.playerHand).toHaveLength(8);
      expect(result.current.gameData.chosenCards).toEqual([]);
      expect(result.current.gameData.discardPile).toEqual([]);
      expect(result.current.canUndo).toBe(false);
    });

    it('increments gamesStarted and records lastPlayed in localStorage', () => {
      const { result } = dealFixtureGame();

      const saved = JSON.parse(localStorage.getItem('regicide-stats')!);
      expect(saved.gamesStarted).toBe(1);
      expect(saved.lastPlayed).not.toBe('Never');

      act(() => result.current.startGame());
      expect(JSON.parse(localStorage.getItem('regicide-stats')!).gamesStarted).toBe(2);
    });
  });

  describe('isValidSelection (combo legality)', () => {
    it('allows any single card as the first pick', () => {
      expect(isValidSelection([], card('hearts', '7'))).toBe(true);
      expect(isValidSelection([], card('spades', 'A'))).toBe(true);
    });

    it('allows an Ace to pair with exactly one non-Ace companion, in either order', () => {
      expect(isValidSelection([card('hearts', '7')], card('spades', 'A'))).toBe(true);
      expect(isValidSelection([card('spades', 'A')], card('hearts', '7'))).toBe(true);
    });

    it('rejects a second Ace or a third card once an Ace has a companion', () => {
      expect(isValidSelection([card('spades', 'A')], card('hearts', 'A'))).toBe(false);
      expect(isValidSelection([card('spades', 'A'), card('hearts', '7')], card('clubs', '5'))).toBe(false);
    });

    it('allows same-rank sets of 2s (up to 4), 3s (up to 3), and 4s (up to 2)', () => {
      expect(isValidSelection([card('hearts', '2'), card('spades', '2'), card('clubs', '2')], card('diamonds', '2'))).toBe(true);
      expect(
        isValidSelection(
          [card('hearts', '2'), card('spades', '2'), card('clubs', '2'), card('diamonds', '2')],
          card('hearts', '2')
        )
      ).toBe(false); // already at the 4-card limit for rank 2

      expect(isValidSelection([card('hearts', '3'), card('spades', '3')], card('clubs', '3'))).toBe(true);
      expect(isValidSelection([card('hearts', '3'), card('spades', '3'), card('clubs', '3')], card('diamonds', '3'))).toBe(false);

      expect(isValidSelection([card('hearts', '4')], card('spades', '4'))).toBe(true);
      expect(isValidSelection([card('hearts', '4'), card('spades', '4')], card('clubs', '4'))).toBe(false);
    });

    it('rejects mismatched ranks and rejects sets above rank 4', () => {
      expect(isValidSelection([card('hearts', '2')], card('spades', '3'))).toBe(false);
      expect(isValidSelection([card('hearts', '5')], card('spades', '5'))).toBe(false);
    });
  });

  describe('selectHandCard - attack phase', () => {
    it('is a no-op before a game has started', () => {
      const { result } = renderHook(() => useRegicideGame());
      const before = result.current.gameData;

      act(() => result.current.selectHandCard(0));

      expect(result.current.gameData).toBe(before);
    });

    it('moves a legally selected card from the hand into chosenCards', () => {
      const { result } = dealFixtureGame();

      act(() => result.current.selectHandCard(0)); // hearts-2

      expect(result.current.gameData.chosenCards.map(cardLabel)).toEqual(['hearts-2']);
      expect(result.current.gameData.playerHand.map(cardLabel)).not.toContain('hearts-2');
      expect(result.current.gameData.message).toBeNull();
    });

    it('sets an "Illegal move" message and leaves state unchanged for an invalid combo', () => {
      const { result } = dealFixtureGame();
      act(() => result.current.selectHandCard(0)); // hearts-2
      const before = result.current.gameData;

      act(() => result.current.selectHandCard(0)); // now hearts-3, mismatched rank

      expect(result.current.gameData.chosenCards).toEqual(before.chosenCards);
      expect(result.current.gameData.playerHand).toEqual(before.playerHand);
      expect(result.current.gameData.message).toEqual({ text: 'Illegal move', tone: 'error' });
    });
  });

  describe('attack / defend / heal - scripted turns against the fixture deal', () => {
    it('damages the royal by the chosen cards total and enters a defend phase when it survives', () => {
      const { result } = dealFixtureGame();
      // hand: hearts-2..9. Play hearts-9 (last card, index 7) alone.
      act(() => result.current.selectHandCard(7));
      act(() => result.current.attack());

      const { gameData } = result.current;
      expect(gameData.royalCard?.health).toBe(11); // 20 - 9
      expect(gameData.royalCard?.attack).toBe(10); // spades not active, attack unchanged
      expect(gameData.activeDeck.map(cardLabel)).toEqual(['hearts-9']);
      expect(gameData.chosenCards).toEqual([]);
      expect(gameData.phase).toBe('defend');
      expect(gameData.defenceRemaining).toBe(10);
      // hearts is off-suit vs the diamonds royal (active), but the discard pile is empty
      expect(gameData.message).toEqual({
        text: 'Unable to heal from discard · Attacking J of diamonds for 9 damage · J of diamonds is attacking for 10',
        tone: 'info',
      });
    });

    it('discarding in the defend phase reduces defenceRemaining and returns to the attack phase once covered', () => {
      const { result } = dealFixtureGame();
      act(() => result.current.selectHandCard(7)); // hearts-9
      act(() => result.current.attack()); // defenceRemaining = 10, hand now hearts-2..8 (7 cards)

      act(() => result.current.selectHandCard(6)); // discard hearts-8
      expect(result.current.gameData.phase).toBe('defend');
      expect(result.current.gameData.defenceRemaining).toBe(2);

      act(() => result.current.selectHandCard(5)); // discard hearts-7 (hand shifted: now last is hearts-7)
      expect(result.current.gameData.phase).toBe('attack');
      expect(result.current.gameData.defenceRemaining).toBe(0);
      expect(result.current.gameData.discardPile.map(cardLabel)).toEqual(['hearts-7', 'hearts-8']);
      expect(result.current.gameData.playerHand).toHaveLength(5);
    });

    it('heals from the discard pile (up to the attack total, capped by pile size) on a later hearts attack', () => {
      const { result } = dealFixtureGame();
      act(() => result.current.selectHandCard(7)); // hearts-9
      act(() => result.current.attack());
      act(() => result.current.selectHandCard(6)); // discard hearts-8
      act(() => result.current.selectHandCard(5)); // discard hearts-7 -> back to attack, discardPile = [hearts-7, hearts-8]
      const tavernBefore = result.current.gameData.tavernDeck.length;

      // hand now hearts-2..6 (5 cards); play hearts-6 (last, index 4)
      act(() => result.current.selectHandCard(4));
      act(() => result.current.attack());

      const { gameData } = result.current;
      expect(gameData.royalCard?.health).toBe(5); // 11 - 6
      expect(gameData.discardPile).toEqual([]);
      expect(gameData.tavernDeck).toHaveLength(tavernBefore + 2);
      expect(gameData.message?.text).toContain('Healing 2 cards from the discard pile');
    });
  });

  describe('attack - suit immunity', () => {
    it('blocks a card whose suit matches the royal - no suit power triggers, but its face value still deals damage', () => {
      const { result } = dealFixtureGame();
      // Redraw via jester before attacking: royal is still diamonds-J, and the
      // fresh hand (front of the 32-card tavern) is hearts-10, diamonds-A..7 -
      // diamonds cards are now available to test the royal's own-suit block.
      act(() => result.current.useJester());
      const hand = result.current.gameData.playerHand;
      const diamondsIndex = hand.findIndex((c) => c.suit === 'diamonds');
      expect(diamondsIndex).toBeGreaterThanOrEqual(0);
      const diamondCard = hand[diamondsIndex];

      act(() => result.current.selectHandCard(diamondsIndex));
      act(() => result.current.attack());

      const { gameData } = result.current;
      expect(gameData.royalCard?.health).toBe(20 - cardValue(diamondCard.rank));
      expect(gameData.message?.text).toContain('♦ power is blocked');
    });
  });

  describe('useJester', () => {
    it('is a no-op with an error message when no jesters remain', () => {
      const { result } = dealFixtureGame();
      act(() => result.current.useJester());
      act(() => result.current.useJester());
      expect(result.current.gameData.jestersRemaining).toBe(0);
      const handBefore = result.current.gameData.playerHand;

      act(() => result.current.useJester());

      expect(result.current.gameData.jestersRemaining).toBe(0);
      expect(result.current.gameData.message).toEqual({ text: 'No jesters remaining', tone: 'error' });
      expect(result.current.gameData.playerHand).toEqual(handBefore);
    });

    it('discards the whole hand and deals a fresh 8-card hand from the tavern deck', () => {
      const { result } = dealFixtureGame();
      const oldHand = result.current.gameData.playerHand;
      const tavernBefore = result.current.gameData.tavernDeck.length;

      act(() => result.current.useJester());

      const { gameData } = result.current;
      expect(gameData.jestersRemaining).toBe(1);
      expect(gameData.playerHand).toHaveLength(8);
      expect(gameData.playerHand.map(cardLabel)).toEqual([
        'hearts-10',
        'diamonds-A',
        'diamonds-2',
        'diamonds-3',
        'diamonds-4',
        'diamonds-5',
        'diamonds-6',
        'diamonds-7',
      ]);
      expect(gameData.discardPile.map(cardLabel).sort()).toEqual(oldHand.map(cardLabel).sort());
      expect(gameData.tavernDeck).toHaveLength(tavernBefore - 8);
    });

    // No dedicated regression test for the tavern-exhaustion fix below
    // (checkHandExhausted is now called after useJester, matching every
    // other hand-mutating action) - constructing that exact state through
    // natural play isn't practical to assert on: with the standard 52-card
    // deck and 2 jesters, jestersRemaining reliably hits 0 (the
    // already-tested loss path) tens of cards before the 32-card tavern
    // deck itself runs dry, verified empirically while writing this test.
    // The fix is still correct/harmless defensive coverage for the case
    // where it would matter.
  });

  describe('undo', () => {
    it('is a no-op with no history', () => {
      const { result } = renderHook(() => useRegicideGame());
      const before = result.current.gameData;

      act(() => result.current.undo());

      expect(result.current.gameData).toBe(before);
      expect(result.current.canUndo).toBe(false);
    });

    it('restores the state from before the last action', () => {
      const { result } = dealFixtureGame();
      const afterStart = result.current.gameData;

      act(() => result.current.selectHandCard(0));
      expect(result.current.gameData.chosenCards).toHaveLength(1);

      act(() => result.current.undo());

      expect(result.current.gameData).toEqual(afterStart);
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('royal defeat', () => {
    it('recycles an exactly-killed royal into the tavern deck (critical hit) and draws the next royal', () => {
      const { result } = dealFixtureGame();
      // royal = diamonds-J (health 20). Bring it to exactly 0 across two attacks
      // with a defend phase in between, using the deterministic hearts-2..9 hand.
      act(() => result.current.selectHandCard(7)); // hearts-9
      act(() => result.current.attack()); // health 11, defend 10 owed
      act(() => result.current.selectHandCard(6)); // discard hearts-8 -> owed 2
      act(() => result.current.selectHandCard(5)); // discard hearts-7 -> owed 0, back to attack
      // hand: hearts-2,3,4,5,6
      act(() => result.current.selectHandCard(4)); // hearts-6
      act(() => result.current.attack()); // health 11-6=5, defend 10 owed again (heals 2 from discard)
      act(() => result.current.selectHandCard(1)); // hearts-3 -> owed 7
      act(() => result.current.selectHandCard(1)); // hearts-4 (shifted) -> owed 3
      act(() => result.current.selectHandCard(0)); // hearts-2 -> owed 1, still defend
      act(() => result.current.selectHandCard(0)); // hearts-5 (only card left) -> owed 0, back to attack
      expect(result.current.gameData.playerHand).toHaveLength(0);
      expect(result.current.gameData.royalCard?.health).toBe(5);

      act(() => result.current.useJester()); // redraw from tavern (jesters remain, no loss)
      const freshHand = result.current.gameData.playerHand;
      const fiveIndex = freshHand.findIndex((c) => cardValue(c.rank) === 5);
      expect(fiveIndex).toBeGreaterThanOrEqual(0);

      act(() => result.current.selectHandCard(fiveIndex));
      act(() => result.current.attack());

      const { gameData } = result.current;
      // Three more Jacks remain queued (only diamonds-J was fought), so the next
      // royal drawn is clubs-J - the defeated diamonds-J itself is what matters here.
      expect(gameData.royalCard).toEqual({ suit: 'clubs', rank: 'J', attack: 10, maxAttack: 10, health: 20, maxHealth: 20 });
      expect(gameData.royalDeck).toHaveLength(10);
      expect(gameData.discardPile.some((c) => c.rank === 'J' && c.suit === 'diamonds')).toBe(false);
      expect(gameData.tavernDeck.some((c) => c.rank === 'J' && c.suit === 'diamonds')).toBe(true);
    });
  });

  describe('loadStats / saveStats', () => {
    it('returns the default stats shape when nothing is saved', () => {
      const { result } = renderHook(() => useRegicideGame());

      expect(result.current.loadStats()).toEqual({
        gamesStarted: 0,
        gamesWon: 0,
        gamesLost: 0,
        lastPlayed: 'Never',
      });
    });

    it('does not mutate the shared defaults across repeated calls', () => {
      const { result } = renderHook(() => useRegicideGame());

      const first = result.current.loadStats();
      first.gamesStarted = 99;
      const second = result.current.loadStats();

      expect(second.gamesStarted).toBe(0);
    });

    it('writes and reads back stats from localStorage', () => {
      const { result } = renderHook(() => useRegicideGame());
      const stats = {
        gamesStarted: 1,
        gamesWon: 1,
        gamesLost: 0,
        lastPlayed: '2026-01-01T00:00:00.000Z',
      };

      act(() => result.current.saveStats(stats));

      expect(result.current.loadStats()).toEqual(stats);
    });
  });

  describe('winGame / loseGame', () => {
    it('winGame increments gamesWon on top of existing stats', () => {
      localStorage.setItem(
        'regicide-stats',
        JSON.stringify({ gamesStarted: 3, gamesWon: 1, gamesLost: 1, lastPlayed: 'Never' })
      );
      const { result } = renderHook(() => useRegicideGame());

      act(() => result.current.winGame());

      expect(JSON.parse(localStorage.getItem('regicide-stats')!).gamesWon).toBe(2);
    });

    it('loseGame increments gamesLost on top of existing stats', () => {
      localStorage.setItem(
        'regicide-stats',
        JSON.stringify({ gamesStarted: 3, gamesWon: 1, gamesLost: 1, lastPlayed: 'Never' })
      );
      const { result } = renderHook(() => useRegicideGame());

      act(() => result.current.loseGame());

      expect(JSON.parse(localStorage.getItem('regicide-stats')!).gamesLost).toBe(2);
    });
  });

  describe('losing when out of cards and jesters', () => {
    it('ends the game as a loss, records loseGame stats, and stops accepting actions', () => {
      const { result } = dealFixtureGame();
      act(() => result.current.useJester());
      act(() => result.current.useJester());
      expect(result.current.gameData.jestersRemaining).toBe(0);

      // Drain the hand via the attack phase (play lone cards, then clear whatever
      // defend is owed) until it's empty with no jesters left.
      let guard = 0;
      while (result.current.gameData.playerHand.length > 0 && guard < 50) {
        act(() => result.current.selectHandCard(0));
        if (result.current.gameData.phase === 'attack' && result.current.gameData.chosenCards.length > 0) {
          act(() => result.current.attack());
        }
        guard++;
      }

      expect(result.current.gameData.gameOver).toBe(true);
      expect(result.current.gameData.victory).toBe(false);
      expect(result.current.gameData.isPlaying).toBe(false);
      expect(JSON.parse(localStorage.getItem('regicide-stats')!).gamesLost).toBe(1);

      const finalState = result.current.gameData;
      act(() => result.current.selectHandCard(0));
      act(() => result.current.attack());
      act(() => result.current.useJester());
      expect(result.current.gameData).toEqual(finalState);
    });
  });
});
