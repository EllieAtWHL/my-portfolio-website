import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMatchById, getAdjacentMatches } from '@/lib/data/matches';
import { getPhotosByMatch, getArticlesByMatch, getSocialMediaByMatch, getVideosByMatch } from '@/lib/data/media';
import { getTeamLineupsByMatch } from '@/lib/data/players';
import MatchInfo from '@/components/spurs-women/MatchInfo';
import MatchStats from '@/components/spurs-women/MatchStats';
import MediaGallery from '@/components/spurs-women/MediaGallery';
import MediaList from '@/components/spurs-women/MediaList';
import VideoGrid from '@/components/spurs-women/VideoGrid';
import ArticleCard from '@/components/spurs-women/ArticleCard';
import MatchNavigation, { HeaderSizeTier } from '@/components/spurs-women/MatchNavigation';
import TeamLineup from '@/components/spurs-women/TeamLineup';
import { CompetitionIcon } from '@/components/spurs-women/CompetitionIcon';
import { Media } from '@/lib/data/media';
import { PhotoMedia } from '@/lib/data/media';
import { generatePageMetadata } from '@/lib/metadata';


interface PageProps {
  params: {
    matchId: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { matchId } = await params;
  const match = await getMatchById(matchId);
  
  if (!match) {
    return generatePageMetadata(
      'Match Not Found - Tottenham Hotspur Women',
      'The requested match could not be found'
    );
  }

  const homeTeam = match.home_team?.name || 'Home Team';
  const awayTeam = match.away_team?.name || 'Away Team';
  const matchDate = match.date ? new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return generatePageMetadata(
    `${homeTeam} vs ${awayTeam} (${matchDate}) - Tottenham Hotspur Women`,
    `Match details for ${homeTeam} vs ${awayTeam} on ${matchDate}`
  );
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { matchId } = await params;

  if (!matchId) {
    notFound();
  }

  const match = await getMatchById(matchId);

  if (!match) {
    notFound();
  }

  const [adjacentMatches, photos, articles, socialMedia, videos, teamLineups] = await Promise.all([
    getAdjacentMatches(matchId, match.date),
    getPhotosByMatch(matchId),
    getArticlesByMatch(matchId),
    getSocialMediaByMatch(matchId),
    getVideosByMatch(matchId),
    getTeamLineupsByMatch(matchId).catch(() => []), // Gracefully handle if player data not available
  ]);

  const { previous: previousMatch, next: nextMatch } = adjacentMatches;

  const homeScore = match.is_home_match ? (match.spurs_score ?? '') : (match.opponent_score ?? '');
  const awayScore = match.is_home_match ? (match.opponent_score ?? '') : (match.spurs_score ?? '');
  const homeScoreStr = homeScore?.toString() || '0';
  const awayScoreStr = awayScore?.toString() || '0';
  const totalHeaderTextLength = (match.home_team?.name?.length || 0) + 
                                (match.away_team?.name?.length || 0) + 
                                homeScoreStr.length + 
                                awayScoreStr.length + 
                                7; // +7 for " vs " and " - " and spaces
  
  const getHeaderSizeTier = (): HeaderSizeTier => {
    let sizeTier: HeaderSizeTier = 'lg';
    if (totalHeaderTextLength > 45) sizeTier = 'sm';
    else if (totalHeaderTextLength > 38) sizeTier = 'md';

    return sizeTier;
  };

  return (
    <main id="main-content" className="p-4 pb-footer-clearance">
      <div className="max-w-6xl mx-auto">
        <MatchNavigation 
          previousMatch={previousMatch} 
          nextMatch={nextMatch}
          currentMatch={match}
          headerSizeTier={getHeaderSizeTier()}
        />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
          {match.competitions && (
            <div className="flex items-center gap-2">
              <CompetitionIcon iconSvg={match.competitions.icon_svg} className="w-5 h-5" />
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

        {/* Match Info Section - Always Full Width */}
        <div className="mb-6">
          <h2 className="font-bold media-title mb-4">Match Info</h2>
          <MatchInfo 
            stadium_display_name={match.stadium_display_name}
            stadium_slug={match.stadium_slug}
            attendance={match.attendance} 
            notes={match.notes} 
            date={match.date} 
            kickoff_time={match.kickoff_time} 
          />
        </div>

        {/* Articles Section - Full Width when present */}
        {articles.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold media-title mb-4">Articles</h2>
            <div className="space-y-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}

        
        {/* Match Stats Section - New Feature */}
        <MatchStats 
          homeTeam={match.home_team?.name}
          awayTeam={match.away_team?.name}
          homeTeamColor={match.home_team?.primary_color || 'blue'}
          awayTeamColor={match.away_team?.primary_color || 'gray'}
          possession={
            match.home_possession !== null && match.away_possession !== null
              ? { home: match.home_possession, away: match.away_possession }
              : undefined
          }
          shots={
            match.home_total_shots !== null && match.away_total_shots !== null &&
            match.home_shots_on_target !== null && match.away_shots_on_target !== null
              ? { 
                  home: { total: match.home_total_shots, onTarget: match.home_shots_on_target }, 
                  away: { total: match.away_total_shots, onTarget: match.away_shots_on_target } 
                }
              : undefined
          }
          corners={
            match.home_corners !== null && match.away_corners !== null
              ? { home: match.home_corners, away: match.away_corners }
              : undefined
          }
        />

        {/* Team Lineups Section - Player Information */}
        {teamLineups && teamLineups.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold media-title mb-4">Team Lineup</h2>
            <div className="space-y-8">
              {teamLineups.map((lineup) => (
                <TeamLineup
                  key={lineup.team_id}
                  lineup={lineup}
                />
              ))}
            </div>
          </div>
        )}

        {/* Staggered Media Sections - Photos first, then Social Media */}
        {photos.length > 0 && (
          <MediaGallery photos={photos as PhotoMedia[]} fullWidth={true} />
        )}

        {socialMedia.length > 0 && (
          <MediaList items={socialMedia as Media[]} title="Social Media" layout="two-column" />
        )}

        {/* Videos Section */}
        {videos.length > 0 && (
          <VideoGrid videos={videos} />
        )}
      </div>
    </main>
  );
}
