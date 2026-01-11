'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
      // For now, use mock data since we don't have Supabase setup
      const mockSeasons: Season[] = [
        { id: 1, name: '2024/25 Season', match_count: 0 },
        { id: 2, name: '2023/24 Season', match_count: 0 },
        { id: 3, name: '2022/23 Season', match_count: 0 },
      ];
      
      setSeasons(mockSeasons);
      setLoading(false);
    }

    fetchSeasons();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Seasons</h1>
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading seasons...</span>
        </div>
      ) : seasons.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seasons.map((season) => (
            <div key={season.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <Link href={`/seasons/${season.id}`} className="block">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {season.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {season.match_count || 0} matches
                </p>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 italic py-12">
          No seasons available at the moment.
        </div>
      )}
    </main>
  );
}
