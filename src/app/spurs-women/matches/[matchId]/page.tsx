'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import MatchHeader from '@/components/spurs-women/MatchHeader';
import MatchInfo from '@/components/spurs-women/MatchInfo';
import MediaGallery from '@/components/spurs-women/MediaGallery';
import MediaList from '@/components/spurs-women/MediaList';
import VideoGallery from '@/components/spurs-women/VideoGallery';
import ArticleCard from '@/components/spurs-women/ArticleCard';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Media, PhotoMedia } from '@/types/media';

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
  const router = useRouter();
  const matchId = params.matchId as string;
  const [match, setMatch] = useState<Match | null>(null);
  const [previousMatch, setPreviousMatch] = useState<Match | null>(null);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [photos, setPhotos] = useState<PhotoMedia[]>([]);
  const [articles, setArticles] = useState<Media[]>([]);
  const [socialMedia, setSocialMedia] = useState<Media[]>([]);
  const [videos, setVideos] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatch() {
      try {
        setLoading(true);
        setError(null);

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
          setError('Failed to load match');
          setLoading(false);
          return;
        }

        setMatch(matchData as Match);

        // Fetch previous match (chronologically before current match)
        const { data: previousData } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
            away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
            competitions:competition_id(name, icon_svg)
          `)
          .lt('date', matchData.date)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        // Fetch next match (chronologically after current match)
        const { data: nextData } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
            away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
            competitions:competition_id(name, icon_svg)
          `)
          .gt('date', matchData.date)
          .order('date', { ascending: true })
          .limit(1)
          .single();

        setPreviousMatch(previousData as Match);
        setNextMatch(nextData as Match);

        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .select('*')
          .eq('match_id', matchId)
          .order('sort_order', { ascending: true });

        if (mediaError) {
          console.error('Error fetching media:', mediaError);
        } else if (mediaData) {
          setPhotos(mediaData.filter((m) => m.type === 'photo' || m.type === 'photo album') as PhotoMedia[]);
          setArticles(mediaData.filter((m) => m.type === 'article'));
          setSocialMedia(mediaData.filter((m) => m.type === 'social media'));
          setVideos(mediaData.filter((m) => m.type === 'video-external'));
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  if (loading) {
    return (
      <main className="p-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">Loading match...</p>
        </div>
      </main>
    );
  }

  if (error || !match) {
    return (
      <main className="p-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-red-600">{error || 'Match not found.'}</p>
        </div>
      </main>
    );
  }

  const homeScore = match.is_home_match ? match.spurs_score : match.opponent_score;
  const awayScore = match.is_home_match ? match.opponent_score : match.spurs_score;

  // Calculate total character count for the complete header display
  const homeScoreStr = homeScore?.toString() || '0';
  const awayScoreStr = awayScore?.toString() || '0';
  const totalHeaderTextLength = match.home_team.name.length + 
                                match.away_team.name.length + 
                                homeScoreStr.length + 
                                awayScoreStr.length + 
                                7; // +7 for " vs " and " - " and spaces
  
  const getHeaderFontSize = () => {
    let fontSize = 'text-2xl'; // default
    if (totalHeaderTextLength > 45) fontSize = 'text-lg';      // Very long headers
    else if (totalHeaderTextLength > 38) fontSize = 'text-xl';   // Long headers
    
    return fontSize;
  };

  const navigateToMatch = (matchId: string) => {
    router.push(`/spurs-women/matches/${matchId}`);
  };

  return (
    <main className="p-4">
      <div className="max-w-6xl mx-auto">
        {/* Mobile navigation buttons - stacked and centered */}
        <div className="flex flex-col gap-2 sm:hidden mb-4 items-center">
          {/* Previous match button */}
          <Button
            variant="spurs"
            onClick={() => navigateToMatch(previousMatch?.id.toString() || '')}
            disabled={!previousMatch}
            className="text-sm !px-4 !py-3 w-11/12 justify-start"
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {previousMatch ? `${previousMatch.home_team.short_name} vs ${previousMatch.away_team.short_name}` : 'No Previous Match'}
            </div>
          </Button>

          {/* Next match button */}
          <Button
            variant="spurs"
            onClick={() => navigateToMatch(nextMatch?.id.toString() || '')}
            disabled={!nextMatch}
            className="text-sm !px-4 !py-3 w-11/12 justify-end"
          >
            <div className="flex items-center">
              {nextMatch ? `${nextMatch.home_team.short_name} vs ${nextMatch.away_team.short_name}` : 'No Next Match'}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Button>
        </div>

        {/* Desktop navigation and header - side by side */}
        <div className="hidden sm:flex justify-between items-center gap-4 mb-1">
          {/* Left navigation button */}
          <Button
            variant="spurs"
            onClick={() => navigateToMatch(previousMatch?.id.toString() || '')}
            disabled={!previousMatch}
            size="sm"
            className="text-xs !px-2 !py-1 !text-xs"
            style={{ padding: '0.25rem 0.5rem !important', fontSize: '0.75rem !important' }}
          >
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {previousMatch ? `${previousMatch.home_team.short_name} vs ${previousMatch.away_team.short_name}` : 'No Previous Match'}
            </div>
          </Button>

          {/* Match header (team names and score) in the middle */}
          <h1 className={`spurs-text font-bold flex items-center gap-2 sm:gap-4 flex-wrap text-center ${getHeaderFontSize()}`}
              style={{
                fontSize: totalHeaderTextLength > 45 ? '1.625rem' : 
                         totalHeaderTextLength > 38 ? '1.875rem' : '2rem'
              }}>
            <span>
              {match.home_team.name}
            </span>
            <span className="text-gray-500">{homeScore} - {awayScore}</span>
            <span>
              {match.away_team.name}
            </span>
          </h1>

          {/* Right navigation button */}
          <Button
            variant="spurs"
            onClick={() => navigateToMatch(nextMatch?.id.toString() || '')}
            disabled={!nextMatch}
            size="sm"
            className="text-xs !px-2 !py-1 !text-xs"
            style={{ padding: '0.25rem 0.5rem !important', fontSize: '0.75rem !important' }}
          >
            <div className="flex items-center">
              {nextMatch ? `${nextMatch.home_team.short_name} vs ${nextMatch.away_team.short_name}` : 'No Next Match'}
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Button>
        </div>

        {/* Mobile match header - centered below buttons */}
        <div className="sm:hidden mb-4">
          <h1 className={`spurs-text font-bold flex items-center justify-center gap-2 flex-wrap text-center ${getHeaderFontSize()}`}
              style={{
                fontSize: totalHeaderTextLength > 45 ? '1.5rem' : 
                         totalHeaderTextLength > 38 ? '1.75rem' : '1.875rem'
              }}>
            <span>
              {match.home_team.name}
            </span>
            <span className="text-gray-500">{homeScore} - {awayScore}</span>
            <span>
              {match.away_team.name}
            </span>
          </h1>
        </div>

        {/* Second row: Competition name and attended badge */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
          {match.competitions && (
            <div className="flex items-center gap-2">
              {match.competitions.icon_svg ? (
                <div className="w-5 h-5" dangerouslySetInnerHTML={{ __html: match.competitions.icon_svg }} />
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
              )}
              <span className="text-lg font-semibold">{match.competitions.name}</span>
            </div>
          )}
          {match.attended && (
            <div className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium self-start sm:self-auto">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M6 5C4.89543 5 4 5.89543 4 7V8.17071C4 8.70201 4.21071 9.21157 4.58579 9.58664L5 10.0009V14.0009L4.58579 14.4151C4.21071 14.7902 4 15.2997 4 15.831V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V15.831C20 15.2997 19.7893 14.7902 19.4142 14.4151L19 14.0009V10.0009L19.4142 9.58664C19.7893 9.21157 20 8.70201 20 8.17071V7C20 5.89543 19.1046 5 18 5H6ZM10 7C10.5523 7 11 7.44772 11 8V16C11 16.5523 10.5523 17 10 17C9.44772 17 9 16.5523 9 16V8C9 7.44772 9.44772 7 10 7Z" />
              </svg>
              Attended
            </div>
          )}
        </div>

        {/* Top section: Match info and articles */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <div>
            <h2 className="text-2xl font-bold media-title mb-4">Game Info</h2>
            <MatchInfo 
              venue={match.venue} 
              attendance={match.attendance} 
              notes={match.notes} 
              date={match.date} 
              kickoff_time={match.kickoff_time} 
            />
          </div>
          {articles.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold media-title mb-4">Articles</h2>
              <div className="space-y-4">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}
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

        {/* Videos section */}
        {videos.length > 0 && (
          <div className="mb-6">
            <VideoGallery videos={videos} />
          </div>
        )}
      </div>
    </main>
  );
}
