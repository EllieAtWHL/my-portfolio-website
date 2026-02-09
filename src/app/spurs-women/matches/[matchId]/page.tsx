import { notFound } from 'next/navigation';
import { getMatchById, getAdjacentMatches } from '@/lib/data/matches';
import { getPhotosByMatch, getArticlesByMatch, getSocialMediaByMatch, getVideosByMatch } from '@/lib/data/media';
import MatchHeader from '@/components/spurs-women/MatchHeader';
import MatchInfo from '@/components/spurs-women/MatchInfo';
import MediaGallery from '@/components/spurs-women/MediaGallery';
import MediaList from '@/components/spurs-women/MediaList';
import VideoGallery from '@/components/spurs-women/VideoGallery';
import ArticleCard from '@/components/spurs-women/ArticleCard';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import MatchNavigation from '@/components/spurs-women/MatchNavigation';
import { Media, PhotoMedia } from '@/types/media';

interface PageProps {
  params: {
    matchId: string;
  };
}

export default async function MatchDetailPage({ params }: PageProps) {
  const matchId = parseInt(params.matchId);

  if (isNaN(matchId)) {
    notFound();
  }

  // Fetch all data in parallel using cached functions
  const [match, adjacentMatches, photos, articles, socialMedia, videos] = await Promise.all([
    getMatchById(matchId),
    getMatchById(matchId).then(match => 
      match ? getAdjacentMatches(matchId, match.date) : { previous: null, next: null }
    ),
    getPhotosByMatch(matchId),
    getArticlesByMatch(matchId),
    getSocialMediaByMatch(matchId),
    getVideosByMatch(matchId),
  ]);

  if (!match) {
    notFound();
  }

  const { previous: previousMatch, next: nextMatch } = adjacentMatches;

  // Calculate total character count for complete header display
  const homeScore = match.is_home_match ? (match.spurs_score ?? '') : (match.opponent_score ?? '');
  const awayScore = match.is_home_match ? (match.opponent_score ?? '') : (match.spurs_score ?? '');
  const homeScoreStr = homeScore?.toString() || '0';
  const awayScoreStr = awayScore?.toString() || '0';
  const totalHeaderTextLength = (match.home_team?.name?.length || 0) + 
                                (match.away_team?.name?.length || 0) + 
                                homeScoreStr.length + 
                                awayScoreStr.length + 
                                7; // +7 for " vs " and " - " and spaces
  
  const getHeaderFontSize = () => {
    let fontSize = 'text-2xl'; // default
    if (totalHeaderTextLength > 45) fontSize = 'text-lg';      // Very long headers
    else if (totalHeaderTextLength > 38) fontSize = 'text-xl';   // Long headers
    
    return fontSize;
  };

  return (
    <main className="p-4">
      <div className="max-w-6xl mx-auto">
        {/* Match Navigation */}
        <MatchNavigation 
          previousMatch={previousMatch} 
          nextMatch={nextMatch}
          currentMatch={match}
          headerFontSize={getHeaderFontSize()}
        />

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
            <MediaGallery photos={photos as PhotoMedia[]} />
            <MediaList items={socialMedia as Media[]} title="Social Media" />
          </div>
        ) : (
          <div className="grid gap-6">
            <MediaGallery photos={photos as PhotoMedia[]} fullWidth={true} />
          </div>
        )}

        {/* Videos section */}
        {videos.length > 0 && (
          <div className="mb-6">
            <VideoGallery videos={videos as Media[]} />
          </div>
        )}
      </div>
    </main>
  );
}
