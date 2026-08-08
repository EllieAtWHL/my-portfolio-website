'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/Card';
import SpursSelect from '@/components/spurs-women/SpursSelect';
import { Suspense } from 'react';

function MatchFiltersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = (searchParams.get('filter') as 'all' | 'upcoming' | 'previous') || 'all';

  const handleFilterChange = (filter: 'all' | 'upcoming' | 'previous') => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', filter);
    }
    router.push(`/spurs-women/matches?${params.toString()}`);
  };

  return (
    <Card variant="spursAccent" padding="md" className="mb-6" hover={false}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="spurs-text text-lg font-semibold">Match Filters</h2>
        <div className="flex items-center gap-4">
          <label htmlFor="match-filter" className="spurs-text text-sm font-medium">
            Filter:
          </label>
          <SpursSelect
            id="match-filter"
            value={currentFilter}
            onChange={(e) => handleFilterChange(e.target.value as 'all' | 'upcoming' | 'previous')}
          >
            <option value="all">All Matches</option>
            <option value="upcoming">Upcoming Only</option>
            <option value="previous">Previous Only</option>
          </SpursSelect>
        </div>
      </div>
    </Card>
  );
}

export default function MatchFilters() {
  return (
    <Suspense fallback={
      <Card variant="spursAccent" padding="md" className="mb-6" hover={false}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="spurs-text text-lg font-semibold">Match Filters</h2>
          <div className="flex items-center gap-4">
            <label htmlFor="match-filter-loading" className="spurs-text text-sm font-medium">
              Filter:
            </label>
            <SpursSelect id="match-filter-loading" value="all" disabled>
              <option value="all">All Matches</option>
              <option value="upcoming">Upcoming Only</option>
              <option value="previous">Previous Only</option>
            </SpursSelect>
          </div>
        </div>
      </Card>
    }>
      <MatchFiltersInner />
    </Suspense>
  );
}
