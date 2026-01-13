'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import MatchCard from '@/components/spurs-women/MatchCard';

type Match = {
  id: number;
  date: string;
  home_team: {
    id: number;
    name: string;
    short_name: string;
    primary_color: string;
    secondary_color: string;
    is_tottenham: boolean;
  };
  away_team: {
    id: number;
    name: string;
    short_name: string;
    primary_color: string;
    secondary_color: string;
    is_tottenham: boolean;
  };
  spurs_score: number;
  opponent_score: number;
  attended: boolean;
  is_home_match: boolean;
  competitions?: {
    name: string;
    icon_svg?: string;
  };
};

type Season = {
  id: number;
  name: string;
};

export default function SeasonDetail() {
  const params = useParams();
  const seasonId = params.seasonId as string;
  const [matches, setMatches] = useState<Match[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch season name
        const { data: seasonData, error: seasonError } = await supabase
          .from('seasons')
          .select('*')
          .eq('id', seasonId)
          .single();

        if (seasonError) {
          console.error('Error fetching season:', seasonError);
          setError('Failed to load season information');
        } else if (seasonData) {
          setSeason(seasonData as Season);
        }

        // Fetch matches for this season
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:home_team_id (*),
            away_team:away_team_id (*),
            competitions:competition_id (*)
          `)
          .eq('season_id', seasonId)
          .order('date', { ascending: true });

        if (matchError) {
          console.error('Error fetching matches:', matchError);
          setError('Failed to load matches');
        } else if (matchData) {
          setMatches(matchData as Match[]);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (seasonId) {
      fetchData();
    }
  }, [seasonId]);

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          {season ? `${season.name} Matches` : 'Loading season...'}
        </h1>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading matches...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No matches found for this season.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
