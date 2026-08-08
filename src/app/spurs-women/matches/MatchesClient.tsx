'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MatchCard from '@/components/spurs-women/MatchCard';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { getMatchesWithFilter } from '@/lib/data/matches';
import { Match } from '@/lib/data/matches';

export default function MatchesClient() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Load matches on mount, and again whenever retryCount changes (bumped by
  // the "Try Again" button below) - keeps the fetch logic local to the
  // effect rather than a shared useCallback, which is what a memoized
  // fetch function invoked from both an effect and a button triggers
  // react-hooks/set-state-in-effect on, even though the setState calls only
  // ever run after the awaited request settles, never synchronously.
  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const matches = await getMatchesWithFilter('all');
        setAllMatches(matches);
        setFilteredMatches(matches);
        setHasError(false);
      } catch (error) {
        console.error('Error loading matches:', error);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [retryCount]);

  const retryLoadMatches = () => setRetryCount((count) => count + 1);

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
            onRetry={retryLoadMatches}
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
            onFilteredMatchesChange={setFilteredMatches}
          />
        </div>

        {/* Matches list */}
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          ) : (
            <Card variant="spursAccent" padding="lg" className="col-span-full text-center">
              <p className="spurs-text text-lg mb-4">No matches found with the current filters.</p>
              <Button variant="spurs" onClick={() => setFilteredMatches(allMatches)}>
                Clear Filters
              </Button>
            </Card>
          )}
        </div>

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
