'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
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
    <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-6">
      <Button
        variant={currentFilter === 'all' ? 'spurs' : 'secondary'}
        onClick={() => handleFilterChange('all')}
      >
        All Matches
      </Button>
      <Button
        variant={currentFilter === 'upcoming' ? 'spurs' : 'secondary'}
        onClick={() => handleFilterChange('upcoming')}
      >
        Upcoming Only
      </Button>
      <Button
        variant={currentFilter === 'previous' ? 'spurs' : 'secondary'}
        onClick={() => handleFilterChange('previous')}
      >
        Previous Only
      </Button>
    </div>
  );
}

export default function MatchFilters() {
  return (
    <Suspense fallback={
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-6">
        <Button variant="spurs" disabled>All Matches</Button>
        <Button variant="secondary" disabled>Upcoming Only</Button>
        <Button variant="secondary" disabled>Previous Only</Button>
      </div>
    }>
      <MatchFiltersInner />
    </Suspense>
  );
}
