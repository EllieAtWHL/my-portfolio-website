import { renderHook, act } from '@testing-library/react';
import { useRegicideGame } from '../useRegicideGame';

// ---------------------------------------------------------------------------
// Deterministic shuffle fixtures
//
// shuffleDeck() (internal, not exported) drives Math.random() through a
// Fisher-Yates shuffle. Mocking Math.random() to always return 0 makes the
// shuffle fully deterministic. The expected post-shuffle values below were
// derived by running the exact same createDeck/createRoyalDeck/shuffleDeck
// algorithm (copied from the source) in an isolated Node script with
// Math.random mocked to 0 - they are independently computed ground truth,
// not just "whatever the hook happens to return".
//
// With Math.random() always 0:
//   - first popped royal:  hearts J (power 11)
//   - remaining royalDeck (11 cards): diamonds/clubs/spades J, all Q, all K
//   - initial 5-card hand: hearts 3,4,5,6,7 (power sum 25)
//   - next tavernDeck.pop() (i.e. next draw): hearts 2 (power 2)
// ---------------------------------------------------------------------------

function mockShuffleToIdentitySwap() {
  return jest.spyOn(Math, 'random').mockReturnValue(0);
}

const ALL_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;

function fullStandardDeckLabels(): string[] {
  const labels: string[] = [];
  for (const suit of ALL_SUITS) {
    for (let i = 2; i <= 10; i++) labels.push(`${suit}-${i}`);
  }
  for (const suit of ALL_SUITS) {
    labels.push(`${suit}-J`, `${suit}-Q`, `${suit}-K`);
  }
  for (const suit of ALL_SUITS) labels.push(`${suit}-A`);
  return labels.sort();
}

function fullRoyalDeckLabels(): string[] {
  const labels: string[] = [];
  for (const suit of ALL_SUITS) labels.push(`${suit}-J`);
  for (const suit of ALL_SUITS) labels.push(`${suit}-Q`);
  for (const suit of ALL_SUITS) labels.push(`${suit}-K`);
  return labels.sort();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cardLabel = (card: any) => `${card.suit}-${card.rank}`;

describe('useRegicideGame', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  describe('initializeGame', () => {
    it('starts with isLoading true and the default game state before anything runs', () => {
      const { result } = renderHook(() => useRegicideGame());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.gameData).toEqual({
        isPlaying: false,
        currentRoyal: null,
        playerHand: [],
        royalDeck: [],
        tavernDeck: [],
        discardPile: [],
        playerPower: 0,
        royalPower: 0,
        health: 20,
        currentTurn: 0,
        gameOver: false,
        victory: false,
      });
    });

    it('resets an in-progress game back to the default state and clears isLoading', () => {
      const { result } = renderHook(() => useRegicideGame());

      act(() => result.current.startGame());
      expect(result.current.gameData.isPlaying).toBe(true);

      act(() => result.current.initializeGame());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.gameData).toEqual({
        isPlaying: false,
        currentRoyal: null,
        playerHand: [],
        royalDeck: [],
        tavernDeck: [],
        discardPile: [],
        playerPower: 0,
        royalPower: 0,
        health: 20,
        currentTurn: 0,
        gameOver: false,
        victory: false,
      });
    });
  });

  describe('startGame', () => {
    it('deals a 5-card hand, an 11-card royal deck, a 47-card tavern deck, and sets health/turn/isPlaying', () => {
      const { result } = renderHook(() => useRegicideGame());

      act(() => result.current.startGame());

      const { gameData } = result.current;
      expect(gameData.isPlaying).toBe(true);
      expect(gameData.gameOver).toBe(false);
      expect(gameData.victory).toBe(false);
      expect(gameData.health).toBe(20);
      expect(gameData.currentTurn).toBe(1);
      expect(gameData.discardPile).toEqual([]);
      expect(gameData.playerHand).toHaveLength(5);
      // 12 royals minus the one popped as currentRoyal
      expect(gameData.royalDeck).toHaveLength(11);
      expect(gameData.currentRoyal).not.toBeNull();
      // Full 52-card standalone tavern deck minus the 5-card starting hand
      expect(gameData.tavernDeck).toHaveLength(47);
      expect(gameData.royalPower).toBe(gameData.currentRoyal!.power);
      expect(gameData.playerPower).toBe(
        gameData.playerHand.reduce((sum, c) => sum + c.power, 0)
      );
    });

    it('deals from a full, unmodified 52-card deck and a full 12-card royal deck (no missing/duplicated cards)', () => {
      const { result } = renderHook(() => useRegicideGame());

      act(() => result.current.startGame());

      const { gameData } = result.current;
      const dealtLabels = [...gameData.playerHand, ...gameData.tavernDeck]
        .map(cardLabel)
        .sort();
      expect(dealtLabels).toEqual(fullStandardDeckLabels());

      const royalLabels = [...gameData.royalDeck, gameData.currentRoyal!]
        .map(cardLabel)
        .sort();
      expect(royalLabels).toEqual(fullRoyalDeckLabels());
    });

    it('produces the exact deterministic deal when the shuffle is pinned via Math.random', () => {
      mockShuffleToIdentitySwap();
      const { result } = renderHook(() => useRegicideGame());

      act(() => result.current.startGame());

      const { gameData } = result.current;
      expect(gameData.currentRoyal).toEqual({ suit: 'hearts', rank: 'J', power: 11 });
      expect(gameData.royalPower).toBe(11);
      expect(gameData.playerHand.map(cardLabel)).toEqual([
        'hearts-3',
        'hearts-4',
        'hearts-5',
        'hearts-6',
        'hearts-7',
      ]);
      expect(gameData.playerPower).toBe(25);
    });

    it('starting a second game fully replaces the previous game state', () => {
      const { result } = renderHook(() => useRegicideGame());

      act(() => result.current.startGame());
      act(() => result.current.playCard(0));
      const midGameHandLength = result.current.gameData.playerHand.length;
      expect(midGameHandLength).toBe(4);

      act(() => result.current.startGame());

      expect(result.current.gameData.playerHand).toHaveLength(5);
      expect(result.current.gameData.discardPile).toEqual([]);
      expect(result.current.gameData.health).toBe(20);
    });
  });

  describe('playCard', () => {
    it('is a no-op before a game has started (isPlaying false)', () => {
      const { result } = renderHook(() => useRegicideGame());
      const before = result.current.gameData;

      act(() => result.current.playCard(0));

      expect(result.current.gameData).toBe(before);
    });

    it('is a no-op once the game is over', () => {
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());

      // Drain health to 0 to reach a real gameOver state.
      let guard = 0;
      while (!result.current.gameData.gameOver && guard < 500) {
        if (result.current.gameData.playerHand.length === 0) {
          act(() => result.current.drawCard());
        } else {
          act(() => result.current.playCard(0));
        }
        guard++;
      }
      expect(result.current.gameData.gameOver).toBe(true);

      const afterGameOver = result.current.gameData;
      act(() => result.current.playCard(0));

      expect(result.current.gameData).toBe(afterGameOver);
    });

    it('is a no-op when cardIndex is out of range for the current hand', () => {
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());
      const before = result.current.gameData;

      act(() => result.current.playCard(before.playerHand.length));

      expect(result.current.gameData).toBe(before);
    });

    it('reduces health by max(1, royalPower - cardPower), moves the card to the discard pile, and recalculates playerPower', () => {
      mockShuffleToIdentitySwap();
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());

      // Deterministic deal: hand = hearts 3,4,5,6,7 (power 3), royal = hearts J (power 11).
      // damage = max(0, 3 - 11) = 0 (royal not defeated)
      // newHealth = 20 - max(1, 11 - 3) = 20 - 8 = 12
      act(() => result.current.playCard(0));

      const { gameData } = result.current;
      expect(gameData.health).toBe(12);
      expect(gameData.gameOver).toBe(false);
      expect(gameData.discardPile).toEqual([{ suit: 'hearts', rank: '3', power: 3 }]);
      expect(gameData.playerHand.map(cardLabel)).toEqual([
        'hearts-4',
        'hearts-5',
        'hearts-6',
        'hearts-7',
      ]);
      // 4 + 5 + 6 + 7
      expect(gameData.playerPower).toBe(22);
      // Royal is unchanged since it wasn't defeated
      expect(gameData.currentRoyal).toEqual({ suit: 'hearts', rank: 'J', power: 11 });
    });

    it('still takes the minimum 1 damage when the played card is stronger than the royal (health floor, not the raw negative difference)', () => {
      // With Math.random pinned to 0.20: royal = clubs J (power 11),
      // hand = [clubs-3, clubs-K, diamonds-7, hearts-2, clubs-8].
      // Playing index 1 (clubs K, power 13) against a power-11 royal means
      // royalPower - cardPower = -2, so health must drop by max(1, -2) = 1,
      // not by 0 and not by -2 (i.e. health must not increase).
      jest.spyOn(Math, 'random').mockReturnValue(0.2);
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());
      expect(result.current.gameData.currentRoyal).toEqual({ suit: 'clubs', rank: 'J', power: 11 });
      expect(cardLabel(result.current.gameData.playerHand[1])).toBe('clubs-K');

      act(() => result.current.playCard(1));

      const { gameData } = result.current;
      expect(gameData.health).toBe(19);
      expect(gameData.discardPile).toEqual([{ suit: 'clubs', rank: 'K', power: 13 }]);
      expect(gameData.playerHand.map(cardLabel)).toEqual(['clubs-3', 'diamonds-7', 'hearts-2', 'clubs-8']);
      expect(gameData.playerPower).toBe(20);
    });

    it('takes at least 1 damage per play regardless of card strength, so repeated play always drains health to exactly 0 and ends the game as a loss (no royal is ever defeated under the current deck power range)', () => {
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());

      let guard = 0;
      while (!result.current.gameData.gameOver && guard < 500) {
        if (result.current.gameData.playerHand.length === 0) {
          act(() => result.current.drawCard());
        } else {
          act(() => result.current.playCard(0));
        }
        guard++;
      }

      expect(result.current.gameData.gameOver).toBe(true);
      expect(result.current.gameData.victory).toBe(false);
      expect(result.current.gameData.health).toBe(0);
    });
  });

  describe('drawCard', () => {
    it('is a no-op before a game has started', () => {
      const { result } = renderHook(() => useRegicideGame());
      const before = result.current.gameData;

      act(() => result.current.drawCard());

      expect(result.current.gameData).toBe(before);
    });

    it('is a no-op once the game is over', () => {
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());
      let guard = 0;
      while (!result.current.gameData.gameOver && guard < 500) {
        if (result.current.gameData.playerHand.length === 0) {
          act(() => result.current.drawCard());
        } else {
          act(() => result.current.playCard(0));
        }
        guard++;
      }
      const afterGameOver = result.current.gameData;

      act(() => result.current.drawCard());

      expect(result.current.gameData).toBe(afterGameOver);
    });

    it('is a no-op once the tavern deck is empty', () => {
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());

      // Tavern deck starts at 47 after the initial deal - drain it.
      for (let i = 0; i < 47; i++) {
        act(() => result.current.drawCard());
      }
      expect(result.current.gameData.tavernDeck).toHaveLength(0);
      const empty = result.current.gameData;

      act(() => result.current.drawCard());

      expect(result.current.gameData).toBe(empty);
    });

    it('moves a card from tavernDeck to playerHand and recalculates playerPower', () => {
      mockShuffleToIdentitySwap();
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());

      act(() => result.current.drawCard());

      const { gameData } = result.current;
      expect(gameData.tavernDeck).toHaveLength(46);
      expect(gameData.playerHand).toHaveLength(6);
      expect(cardLabel(gameData.playerHand[5])).toBe('hearts-2');
      // original hand power 25 + drawn hearts-2 (power 2)
      expect(gameData.playerPower).toBe(27);
    });
  });

  describe('loadStats', () => {
    it('returns the default stats shape when nothing is saved', () => {
      const { result } = renderHook(() => useRegicideGame());

      expect(result.current.loadStats()).toEqual({
        gamesStarted: 0,
        gamesWon: 0,
        gamesLost: 0,
        lastPlayed: 'Never',
        totalPlayTime: 0,
      });
    });

    it('parses and returns saved stats from localStorage', () => {
      const saved = {
        gamesStarted: 4,
        gamesWon: 2,
        gamesLost: 1,
        lastPlayed: '2026-01-01T00:00:00.000Z',
        totalPlayTime: 123,
      };
      localStorage.setItem('regicide-stats', JSON.stringify(saved));
      const { result } = renderHook(() => useRegicideGame());

      expect(result.current.loadStats()).toEqual(saved);
    });
  });

  describe('saveStats', () => {
    it('writes the given stats object to localStorage as JSON', () => {
      const { result } = renderHook(() => useRegicideGame());
      const stats = {
        gamesStarted: 1,
        gamesWon: 1,
        gamesLost: 0,
        lastPlayed: '2026-01-01T00:00:00.000Z',
        totalPlayTime: 10,
      };

      act(() => result.current.saveStats(stats));

      expect(localStorage.getItem('regicide-stats')).toBe(JSON.stringify(stats));
    });
  });

  describe('winGame', () => {
    it('increments gamesWon on top of existing stats, persists it, and sets isPlaying false', () => {
      localStorage.setItem(
        'regicide-stats',
        JSON.stringify({ gamesStarted: 3, gamesWon: 1, gamesLost: 1, lastPlayed: 'Never', totalPlayTime: 0 })
      );
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());

      act(() => result.current.winGame());

      expect(result.current.gameData.isPlaying).toBe(false);
      const saved = JSON.parse(localStorage.getItem('regicide-stats')!);
      expect(saved.gamesWon).toBe(2);
      expect(saved.gamesLost).toBe(1);
    });

    it('increments gamesWon from the default of 0 when nothing was previously saved', () => {
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());

      act(() => result.current.winGame());

      const saved = JSON.parse(localStorage.getItem('regicide-stats')!);
      expect(saved.gamesWon).toBe(1);
    });
  });

  describe('loseGame', () => {
    it('increments gamesLost on top of existing stats, persists it, and sets isPlaying false', () => {
      localStorage.setItem(
        'regicide-stats',
        JSON.stringify({ gamesStarted: 3, gamesWon: 1, gamesLost: 1, lastPlayed: 'Never', totalPlayTime: 0 })
      );
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());

      act(() => result.current.loseGame());

      expect(result.current.gameData.isPlaying).toBe(false);
      const saved = JSON.parse(localStorage.getItem('regicide-stats')!);
      expect(saved.gamesLost).toBe(2);
      expect(saved.gamesWon).toBe(1);
    });
  });

  describe('endTurn / undoAction (stub behaviour)', () => {
    it('endTurn logs without throwing or changing game state', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());
      const before = result.current.gameData;

      act(() => result.current.endTurn());

      expect(logSpy).toHaveBeenCalledWith('Ending turn...');
      expect(result.current.gameData).toBe(before);
    });

    it('undoAction logs without throwing or changing game state', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const { result } = renderHook(() => useRegicideGame());
      act(() => result.current.startGame());
      const before = result.current.gameData;

      act(() => result.current.undoAction());

      expect(logSpy).toHaveBeenCalledWith('Undoing action...');
      expect(result.current.gameData).toBe(before);
    });
  });
});
