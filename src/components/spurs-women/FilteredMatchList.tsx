'use client';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import MatchCard from './MatchCard';
import { Match } from '@/lib/data/matches';

interface FilteredMatchListProps {
  matches: Match[];
  emptyMessage: string;
  /** When provided, the empty state renders as a grid item with a "Clear Filters" button. */
  onClear?: () => void;
  gridClassName?: string;
}

const DEFAULT_GRID_CLASS = 'grid gap-4 sm:grid-cols-1 lg:grid-cols-2';

export default function FilteredMatchList({
  matches,
  emptyMessage,
  onClear,
  gridClassName = DEFAULT_GRID_CLASS,
}: FilteredMatchListProps) {
  if (matches.length === 0 && !onClear) {
    return (
      <Card variant="spursAccent" padding="md" hover={false}>
        <p className="spurs-text">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className={gridClassName}>
      {matches.length > 0 ? (
        matches.map((match) => <MatchCard key={match.id} match={match} />)
      ) : (
        <Card variant="spursAccent" padding="lg" className="col-span-full text-center">
          <p className="spurs-text text-lg mb-4">{emptyMessage}</p>
          {onClear && (
            <Button variant="spurs" onClick={onClear}>
              Clear Filters
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
