'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { getSeasonsList } from '@/lib/data';
import { SeasonWithMatchCount } from '@/lib/data';

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<SeasonWithMatchCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = 'Seasons - Tottenham Hotspur Women';
    
    async function fetchSeasons() {
      try {
        const seasonsData = await getSeasonsList();
        setSeasons(seasonsData);
      } catch (error) {
        console.error('Error fetching seasons:', error);
        setSeasons([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSeasons();
  }, []);

  return (
    <main className="p-8">
      <h1 className="spurs-text text-3xl font-bold mb-6">Seasons</h1>
      {loading ? (
        <p>Loading seasons...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => (
            <Link
              key={season.id}
              href={`/spurs-women/seasons/${season.id}`}
              className="block"
            >
              <Card variant="spursAccent" hover={true}>
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">{season.name}</h2>
                  <p className="text-sm">
                    {season.match_count === 0 ? 'No matches' : `${season.match_count} match${season.match_count === 1 ? '' : 'es'}`}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
