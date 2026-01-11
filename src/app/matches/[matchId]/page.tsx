'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@utils/supabase';
import MatchHeader from '@components/MatchHeader';
import MatchInfo from '@components/MatchInfo';
import MediaGallery from '@components/MediaGallery';
import MediaList from '@components/MediaList';
import { Media, PhotoMedia } from '../../../types/media';

type Match = {
  id: number;
  date: string;
  kickoff_time: string | null;
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
  venue: string | null;
  attendance: number | null;
  notes: string | null;
  competitions?: {
    name: string;
    icon_svg?: string;
  };
};

export default function MatchDetail() {
  const params = useParams();
  const matchId = params.matchId!;
  const [match, setMatch] = useState<Match | null>(null);
  const [photos, setPhotos] = useState<PhotoMedia[]>([]);
  const [articles, setArticles] = useState<Media[]>([]);
  const [socialMedia, setSocialMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = 'Match Details - Tottenham Hotspur Women';
    
    async function fetchMatch() {
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
          away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
          competitions:competition_id(name, icon_svg)
        `)
        .eq('id', matchId)
        .single();

      if (matchError) {
        console.error('Error fetching match:', matchError);
        setLoading(false);
        return;
      }

      setMatch(matchData as Match);

      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('match_id', matchId)
        .order('sort_order', { ascending: true });

      if (mediaError) console.error('Error fetching media:', mediaError);
      else if (mediaData) {
        setPhotos(mediaData.filter((m) => m.type === 'photo' || m.type === 'photo album') as PhotoMedia[]);
        setArticles(mediaData.filter((m) => m.type === 'article'));
        setSocialMedia(mediaData.filter((m) => m.type === 'social media'));
      }

      setLoading(false);
    }

    fetchMatch();
  }, [matchId]);

  if (loading) return <p className="p-8">Loading match...</p>;
  if (!match) return <p className="p-8">Match not found.</p>;

  const homeScore = match.is_home_match ? match.spurs_score : match.opponent_score;
  const awayScore = match.is_home_match ? match.opponent_score : match.spurs_score;

  return (
    <main className="p-8">
      <MatchHeader
        home_team={match.home_team}
        away_team={match.away_team}
        homeScore={homeScore}
        awayScore={awayScore}
        attended={match.attended}
        competition={match.competitions}
      />

      {/* Top section: Match info and articles */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <MatchInfo venue={match.venue} attendance={match.attendance} notes={match.notes} date={match.date} kickoff_time={match.kickoff_time} />
        <MediaList items={articles} title="Articles" />
      </div>

      {/* Bottom section: Photos and social media */}
      {socialMedia.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <MediaGallery photos={photos} />
          <MediaList items={socialMedia} title="Social Media" />
        </div>
      ) : (
        <div className="grid gap-6">
          <MediaGallery photos={photos} fullWidth={true} />
        </div>
      )}
    </main>
  );
}
