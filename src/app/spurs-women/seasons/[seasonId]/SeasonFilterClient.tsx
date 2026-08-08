'use client';

import { useState } from 'react';
import MatchCard from '@/components/spurs-women/MatchCard';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import SeasonReviewCard from '@/components/spurs-women/SeasonReviewCard';
import SeasonStats from '@/components/spurs-women/SeasonStats';
import { Match } from '@/lib/data/matches';
import { SeasonReview } from '@/lib/data/seasons';

interface SeasonFilterClientProps {
  matches: Match[];
  seasonName: string;
  seasonReview?: SeasonReview | null;
}

export default function SeasonFilterClient({ matches, seasonName, seasonReview }: SeasonFilterClientProps) {
  const [filteredMatches, setFilteredMatches] = useState<Match[]>(matches);

  return (
    <main id="main-content" className="p-8 pb-footer-clearance">
      <div className="max-w-6xl mx-auto">
        <h1 className="spurs-text font-bold mb-6 text-center">
          {seasonName}
        </h1>

        {/* Season Review Card */}
        <SeasonReviewCard 
          review={seasonReview} 
        />

        {/* Season Stats */}
        <SeasonStats matches={filteredMatches} seasonName={seasonName} />

        {/* Comprehensive Filters */}
        <MatchFilterControls
          matches={matches}
          onFilteredMatchesChange={setFilteredMatches}
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
