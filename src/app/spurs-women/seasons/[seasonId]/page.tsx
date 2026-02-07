'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MatchCard from '@/components/spurs-women/MatchCard';
import { getMatchesBySeason, getSeasonDetails } from '@/lib/data';
import { Match, Season } from '@/lib/data';

export default function SeasonDetail() {
  const params = useParams();
  const seasonId = params.seasonId!;
  const [matches, setMatches] = useState<Match[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = 'Season Details - Tottenham Hotspur Women';
    
    async function fetchData() {
      try {
        setLoading(true);
        
        const seasonIdNum = parseInt(seasonId as string);
        
        // Fetch season name and matches in parallel
        const [seasonData, matchData] = await Promise.all([
          getSeasonDetails(seasonIdNum),
          getMatchesBySeason(seasonIdNum)
        ]);
        
        setSeason(seasonData);
        setMatches(matchData);
      } catch (error) {
        console.error('Error fetching season data:', error);
        setSeason(null);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [seasonId]);

  return (
    <main className="p-8">
      <h1 className="spurs-text text-3xl font-bold mb-6">
        {season ? `Matches for ${season.name}` : 'Loading season...'}
      </h1>

      {loading ? (
        <p>Loading matches...</p>
      ) : matches.length === 0 ? (
        <p>No matches found for this season.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </main>
  );
}
