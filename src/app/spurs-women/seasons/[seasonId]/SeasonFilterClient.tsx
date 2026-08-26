'use client';

import FilteredMatchList from '@/components/spurs-women/FilteredMatchList';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import SeasonReviewCard from '@/components/spurs-women/SeasonReviewCard';
import SeasonStats from '@/components/spurs-women/SeasonStats';
import { useFilteredMatches } from '@/hooks/useFilteredMatches';
import { Match } from '@/lib/data/matches';
import { SeasonReview } from '@/lib/data/seasons';

interface SeasonFilterClientProps {
  matches: Match[];
  seasonName: string;
  seasonReview?: SeasonReview | null;
}

export default function SeasonFilterClient({ matches, seasonName, seasonReview }: SeasonFilterClientProps) {
  const { filteredMatches, onFilteredMatchesChange, resetFilters } = useFilteredMatches(matches);

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
          onFilteredMatchesChange={onFilteredMatchesChange}
        />

        {/* Matches Grid */}
        <FilteredMatchList
          matches={filteredMatches}
          emptyMessage="No matches found with the current filters."
          onClear={resetFilters}
        />
      </div>
    </main>
  );
}
