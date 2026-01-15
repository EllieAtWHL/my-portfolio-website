'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

type Season = {
  id: number;
  name: string;
  match_count?: number;
};

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = 'Seasons - Tottenham Hotspur Women';
    
    async function fetchSeasons() {
      // Fetch seasons first
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select('*')
        .order('id', { ascending: false });

      if (seasonsError) {
        console.error('Supabase error fetching seasons:', seasonsError);
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
      setLoading(false);
    }

    fetchSeasons();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Seasons</h1>
      {loading ? (
        <p>Loading seasons...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => (
            <Link
              key={season.id}
              href={`/spurs-women/seasons/${season.id}`}
              className="border rounded-lg p-4 shadow hover:shadow-lg transition block"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold">{season.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {season.match_count === 0 ? 'No matches' : `${season.match_count} match${season.match_count === 1 ? '' : 'es'}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
