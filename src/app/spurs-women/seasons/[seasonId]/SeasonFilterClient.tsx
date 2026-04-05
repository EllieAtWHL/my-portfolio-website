'use client';

import { useState } from 'react';
import MatchCard from '@/components/spurs-women/MatchCard';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import { Match } from '@/lib/data/matches';

interface SeasonFilterClientProps {
  matches: Match[];
  seasonName: string;
}

export default function SeasonFilterClient({ matches, seasonName }: SeasonFilterClientProps) {
  const [filteredMatches, setFilteredMatches] = useState<Match[]>(matches);

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="spurs-text text-3xl font-bold mb-6">
          Matches for {seasonName}
        </h1>

        {/* Comprehensive Filters */}
        <MatchFilterControls
          matches={matches}
          onFilteredMatchesChange={setFilteredMatches}
          title={`Filters - ${seasonName}`}
        />

        {/* Matches Grid */}
        {filteredMatches.length === 0 ? (
          <Card variant="spursAccent" padding="lg" className="text-center">
            <p className="spurs-text text-lg mb-4">No matches found with the current filters.</p>
            <Button variant="spurs" onClick={() => setFilteredMatches(matches)}>
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
