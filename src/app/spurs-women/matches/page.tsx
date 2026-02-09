import Link from 'next/link';
import MatchCard from '@/components/spurs-women/MatchCard';
import MatchFilters from '@/components/spurs-women/MatchFilters';
import { Button } from '@/components/Button';
import { getMatchesWithFilter } from '@/lib/data';
import { Match } from '@/lib/data';

interface MatchesPageProps {
  searchParams: {
    filter?: 'all' | 'upcoming' | 'previous';
  };
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const filter = searchParams.filter || 'all';
  
  // Fetch matches server-side with caching
  const matches = await getMatchesWithFilter(filter);

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="spurs-text text-3xl font-bold mb-4 text-center">All Tottenham Hotspur Women Matches</h1>
          
          {/* Filter buttons - client component for interactivity */}
          <MatchFilters />
        </div>

        {/* Matches list */}
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {matches.length > 0 ? (
            matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          ) : (
            <div className="col-span-full text-center">
              <p className="text-gray-500 italic">
                {filter === 'upcoming' 
                  ? 'No upcoming matches scheduled' 
                  : filter === 'previous' 
                    ? 'No previous matches' 
                    : 'No matches found'
                }
              </p>
            </div>
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
