import { renderHook, act } from '@testing-library/react';
import { useMicrobrewGame } from '../useMicrobrewGame';

// The rules are covered in depth by src/lib/microbrew/__tests__/game.test.ts
// (including the deterministic shuffle fixture this relies on). These tests
// only check the hook wires state through to those transitions.

describe('useMicrobrewGame', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('has no game until one is started', () => {
    const { result } = renderHook(() => useMicrobrewGame());

    expect(result.current.game).toBeNull();
    expect(result.current.recipeBacks).toBeNull();
  });

  it('ignores setup actions before a game has started', () => {
    const { result } = renderHook(() => useMicrobrewGame());

    act(() => result.current.returnRecipe('recipe-01'));
    act(() => result.current.swapSetupHop({ column: 0, slot: 0 }));
    expect(result.current.game).toBeNull();
  });

  it('runs a new game through both setup choices into play', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { result } = renderHook(() => useMicrobrewGame());

    act(() => result.current.startGame('Alice', 'Bob'));
    expect(result.current.game?.phase).toBe('returnRecipe');
    expect(result.current.recipeBacks).toEqual([['medium'], ['dark', 'light']]);

    act(() => result.current.returnRecipe('recipe-07'));
    expect(result.current.game?.phase).toBe('hopSwap');
    expect(result.current.recipeBacks).toEqual([['medium'], ['dark']]);

    act(() => result.current.swapSetupHop({ column: 1, slot: 1 }));
    act(() => result.current.swapSetupHop({ column: 2, slot: 1 }));
    expect(result.current.game?.phase).toBe('playing');
    expect(result.current.game?.board.tin).toHaveLength(22);
  });

  it('brews through a chain and ends it', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { result } = renderHook(() => useMicrobrewGame());
    act(() => result.current.startGame('Alice', 'Bob'));
    act(() => result.current.returnRecipe('recipe-07'));
    act(() => result.current.swapSetupHop({ column: 1, slot: 1 }));
    act(() => result.current.swapSetupHop({ column: 2, slot: 1 }));

    // Alice's hop is at (1,1); move it down-left.
    act(() => result.current.brewSwap({ column: 1, slot: 1 }, { column: 0, slot: 0 }));
    expect(result.current.game?.brew).toEqual({ slot: { column: 0, slot: 0 }, swaps: 1 });
    expect(result.current.game?.players[0].copper[0][0]).toBe('hops');

    act(() => result.current.endBrew());
    expect(result.current.game?.brew).toBeNull();
  });

  it('ignores Brew actions before a game has started', () => {
    const { result } = renderHook(() => useMicrobrewGame());

    act(() => result.current.brewSwap({ column: 0, slot: 0 }, { column: 1, slot: 0 }));
    act(() => result.current.endBrew());
    expect(result.current.game).toBeNull();
  });
});
