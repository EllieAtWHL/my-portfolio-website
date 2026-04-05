'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import MatchCard from '@/components/spurs-women/MatchCard';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { getMatchesWithFilter } from '@/lib/data/matches';
import { Match } from '@/lib/data/matches';

interface MatchesPageProps {
  searchParams: Promise<{
    filter?: 'all' | 'upcoming' | 'previous';
  }>;
}

export default function MatchesPage({ searchParams }: MatchesPageProps) {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Load matches on component mount
  useMemo(() => {
    const loadMatches = async () => {
      try {
        const matches = await getMatchesWithFilter('all');
        setAllMatches(matches);
        setFilteredMatches(matches);
      } catch (error) {
        console.error('Error loading matches:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMatches();
  }, []);

  if (loading) {
    return (
      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="spurs-text text-lg">Loading matches...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="spurs-text text-3xl font-bold mb-4 text-center">All Tottenham Hotspur Women Matches</h1>
          
          {/* Comprehensive filter controls */}
          <MatchFilterControls
            matches={allMatches}
            onFilteredMatchesChange={setFilteredMatches}
            title="Match Filters"
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
