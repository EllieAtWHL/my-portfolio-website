'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { Card } from '@/components/Card';

type Season = {
  id: number;
  name: string;
  match_count?: number;
};

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSeasons() {
      try {
        setLoading(true);
        setError(null);

        // Fetch seasons first
        const { data: seasonsData, error: seasonsError } = await supabase
          .from('seasons')
          .select('*')
          .order('id', { ascending: false });

        if (seasonsError) {
          console.error('Supabase error fetching seasons:', seasonsError);
          setError('Failed to load seasons');
          setLoading(false);
          return;
        }

        if (!seasonsData) {
          setSeasons([]);
          setLoading(false);
          return;
        }

        // Fetch match counts for each season
        const seasonsWithCounts = await Promise.all(
          (seasonsData as Season[]).map(async (season) => {
            const { count, error: countError } = await supabase
              .from('matches')
              .select('*', { count: 'exact', head: true })
              .eq('season_id', season.id);

            return {
              ...season,
              match_count: countError ? 0 : count || 0
            };
          })
        );

        setSeasons(seasonsWithCounts);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchSeasons();
  }, []);

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Seasons</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading seasons...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : seasons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No seasons found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seasons.map((season) => (
              <Link
                key={season.id}
                href={`/spurs-women/seasons/${season.id}`}
                className="block"
              >
                <Card variant="accent" padding="md" hover={true} className="spurs-season-card">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold">{season.name}</h2>
                    <p className="text-sm text-spurs-gray">
                      {season.match_count === 0 
                        ? 'No matches' 
                        : `${season.match_count} match${season.match_count === 1 ? '' : 'es'}`
                      }
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
