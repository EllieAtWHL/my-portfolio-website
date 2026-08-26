'use client';

import Link from 'next/link';
import FilteredMatchList from '@/components/spurs-women/FilteredMatchList';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { useRetryableAsync } from '@/hooks/useRetryableAsync';
import { useFilteredMatches } from '@/hooks/useFilteredMatches';
import { getMatchesWithFilter, Match } from '@/lib/data/matches';

export default function MatchesClient() {
  const { data: allMatches, loading, hasError, retry } = useRetryableAsync<Match[]>(
    () => getMatchesWithFilter('all'),
    [],
    [],
    'Error loading matches:'
  );
  const { filteredMatches, onFilteredMatchesChange, resetFilters } = useFilteredMatches(allMatches);

  if (loading) {
    return (
      <main id="main-content" className="p-8 pb-footer-clearance">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="spurs-text text-lg">Loading matches...</p>
          </div>
        </div>
      </main>
    );
  }

  if (hasError) {
    return (
      <main id="main-content" className="p-8 pb-footer-clearance">
        <div className="max-w-6xl mx-auto">
          <h1 className="spurs-text font-bold mb-8 text-center">All Tottenham Hotspur Women Matches</h1>
          <ErrorState
            message="Couldn't load matches. Please try again."
            onRetry={retry}
            cardVariant="spursAccent"
            buttonVariant="spurs"
          />
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="p-8 pb-footer-clearance">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="spurs-text font-bold mb-4 text-center">All Tottenham Hotspur Women Matches</h1>

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
      </div>
    </main>
  );
}
