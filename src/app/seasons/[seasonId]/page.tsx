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
  const seasonId = params.seasonId!;
  const [matches, setMatches] = useState<Match[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = 'Season Details - Tottenham Hotspur Women';
    
    async function fetchData() {
      // Fetch season name
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', seasonId)
        .single();

      if (seasonError) {
        console.error('Error fetching season:', seasonError);
      } else {
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
      } else {
        setMatches(matchData as Match[]);
      }

      setLoading(false);
    }

    fetchData();
  }, [seasonId]);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">
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
