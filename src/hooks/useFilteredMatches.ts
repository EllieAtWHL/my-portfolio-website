'use client';

import { useCallback, useState } from 'react';
import { Match } from '@/lib/data/matches';

interface UseFilteredMatchesResult {
  filteredMatches: Match[];
  onFilteredMatchesChange: (newFilteredMatches: Match[]) => void;
  resetFilters: () => void;
}

/**
 * Tracks the matches passed to a MatchFilterControls, resetting back to the
 * full `matches` list whenever it changes (e.g. once an in-flight fetch resolves).
 */
export function useFilteredMatches(matches: Match[]): UseFilteredMatchesResult {
  // Reset during render rather than in an effect - this is the array whose
  // identity change we're reacting to, so comparing it against the previous
  // render's value here avoids the extra "effect fires after commit" render
  // pass (and the react-hooks/set-state-in-effect violation that comes with
  // setting state from inside a useEffect keyed on a prop).
  const [prevMatches, setPrevMatches] = useState(matches);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>(matches);

  if (matches !== prevMatches) {
    setPrevMatches(matches);
    setFilteredMatches(matches);
  }

  const onFilteredMatchesChange = useCallback((newFilteredMatches: Match[]) => {
    setFilteredMatches(newFilteredMatches);
  }, []);

  const resetFilters = useCallback(() => setFilteredMatches(matches), [matches]);

  return { filteredMatches, onFilteredMatchesChange, resetFilters };
}
