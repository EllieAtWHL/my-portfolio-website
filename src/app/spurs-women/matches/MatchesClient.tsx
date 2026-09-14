'use client';

import Link from 'next/link';
import AsyncPageShell from '@/components/spurs-women/AsyncPageShell';
import FilteredMatchList from '@/components/spurs-women/FilteredMatchList';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import { Button } from '@/components/Button';
import { useRetryableAsync } from '@/hooks/useRetryableAsync';
import { useFilteredMatches } from '@/hooks/useFilteredMatches';
import { getMatchesWithFilter, Match } from '@/lib/data/matches';

// Single source of truth: shown both as AsyncPageShell's error-state heading
// and, verbatim, as this page's own success-state <h1> below - keeping these
// as one constant instead of two string literals prevents them silently
// drifting apart if either is edited later.
const HEADING = 'All Tottenham Hotspur Women Matches';

export default function MatchesClient() {
  const { data: allMatches, loading, hasError, retry } = useRetryableAsync<Match[]>(
    () => getMatchesWithFilter('all'),
    [],
    [],
    'Error loading matches:'
  );
  const { filteredMatches, onFilteredMatchesChange, resetFilters } = useFilteredMatches(allMatches);

  return (
    <AsyncPageShell
      loading={loading}
      hasError={hasError}
      onRetry={retry}
      loadingLabel="matches"
      heading={HEADING}
      errorMessage="Couldn't load matches. Please try again."
    >
      <div className="mb-8">
        <h1 className="spurs-text font-bold mb-4 text-center">{HEADING}</h1>

        {/* Comprehensive filter controls */}
        <MatchFilterControls
          matches={allMatches}
          onFilteredMatchesChange={onFilteredMatchesChange}
        />
      </div>

      {/* Matches list */}
      <FilteredMatchList
        matches={filteredMatches}
        emptyMessage="No matches found with the current filters."
        onClear={resetFilters}
      />

      {/* Back to seasons link */}
      <div className="mt-12 text-center">
        <Link href="/spurs-women/seasons">
          <Button variant="spurs">
            Back to Seasons
          </Button>
        </Link>
      </div>
    </AsyncPageShell>
  );
}
