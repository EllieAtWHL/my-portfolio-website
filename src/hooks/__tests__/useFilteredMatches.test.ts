import { renderHook, act } from '@testing-library/react';
import { useFilteredMatches } from '../useFilteredMatches';
import { Match } from '@/lib/data/matches';

const matchA = { id: 'a' } as unknown as Match;
const matchB = { id: 'b' } as unknown as Match;
const matches: Match[] = [matchA, matchB];

describe('useFilteredMatches', () => {
  it('starts with the full match list', () => {
    const { result } = renderHook(() => useFilteredMatches(matches));
    expect(result.current.filteredMatches).toEqual(matches);
  });

  it('updates filteredMatches when onFilteredMatchesChange is called', () => {
    const { result } = renderHook(() => useFilteredMatches(matches));

    act(() => result.current.onFilteredMatchesChange([matchA]));

    expect(result.current.filteredMatches).toEqual([matchA]);
  });

  it('resets to the full match list via resetFilters', () => {
    const { result } = renderHook(() => useFilteredMatches(matches));

    act(() => result.current.onFilteredMatchesChange([matchA]));
    act(() => result.current.resetFilters());

    expect(result.current.filteredMatches).toEqual(matches);
  });

  it('syncs back to the new match list when the source matches change (e.g. after a fetch resolves)', () => {
    const { result, rerender } = renderHook(({ m }: { m: Match[] }) => useFilteredMatches(m), {
      initialProps: { m: [] as Match[] },
    });

    expect(result.current.filteredMatches).toEqual([]);

    act(() => result.current.onFilteredMatchesChange([]));
    rerender({ m: matches });

    expect(result.current.filteredMatches).toEqual(matches);
  });
});
