'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MatchCard from '@/components/spurs-women/MatchCard';
import { Button } from '@/components/Button';
import { getMatchesWithFilter } from '@/lib/data';
import { Match } from '@/lib/data';

export default function MatchesPage() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'previous'>('all');

  useEffect(() => {
    async function fetchAllMatches() {
      try {
        setLoading(true);
        setError(null);
        
        const matches = await getMatchesWithFilter(filter);
        setAllMatches(matches);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
        setAllMatches([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAllMatches();
  }, [filter]);

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="spurs-text text-3xl font-bold mb-4 text-center">All Tottenham Hotspur Women Matches</h1>
          
          {/* Filter buttons */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-6">
            <Button
              variant={'spurs'}
              onClick={() => setFilter('all')}
            >
              All Matches
            </Button>
            <Button
              variant={'spurs'}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming Only
            </Button>
            <Button
              variant={'spurs'}
              onClick={() => setFilter('previous')}
            >
              Previous Only
            </Button>
          </div>
        </div>

        {/* Matches list */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading matches...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {allMatches.length > 0 ? (
              allMatches.map((match) => (
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
        )}

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
