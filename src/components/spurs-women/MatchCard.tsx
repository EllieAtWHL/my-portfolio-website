import Link from 'next/link';
import { Card } from '@/components/Card';
import { Match } from '@/lib/data/matches';

// Simple function to generate Tailwind classes from database colors with fallbacks
function getColorClasses(primaryColor: string | null | undefined, secondaryColor: string | null | undefined) {
  // Fallback to gray/white if colors are null or undefined
  const primary = primaryColor || 'gray-500';
  const secondary = secondaryColor || 'white';
  return `bg-${primary} text-${secondary}`;
}

type MatchProps = {
  match: Match;
};

export default function MatchCard({ match }: MatchProps) {
  const homeScore = match.is_home_match ? (match.spurs_score ?? '') : (match.opponent_score ?? '');
  const awayScore = match.is_home_match ? (match.opponent_score ?? '') : (match.spurs_score ?? '');

  return (
    <Link href={`/spurs-women/matches/${match.id}`} className="block spurs-text">
      <Card variant="spursAccent" padding="md">
        {/* Date at top center */}
        <div className="text-center text-sm spurs-text mb-2 flex justify-center items-center gap-4">
          {new Date(match.date).toLocaleDateString()}
          {match.competitions?.name && (
            <span className="spurs-text" title={match.competitions.name}>
              {match.competitions.icon_svg ? (
                <div className="w-4 h-4" dangerouslySetInnerHTML={{ __html: match.competitions.icon_svg }} />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
              )}
            </span>
          )}
        </div>

        {/* Attendance indicator in top right */}
        {new Date(match.date) < new Date() && match.attended && (
          <span className="absolute top-2 right-2 spurs-text" title="Attended">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M6 5C4.89543 5 4 5.89543 4 7V8.17071C4 8.70201 4.21071 9.21157 4.58579 9.58664L5 10.0009V14.0009L4.58579 14.4151C4.21071 14.7902 4 15.2997 4 15.831V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V15.831C20 15.2997 19.7893 14.7902 19.4142 14.4151L19 14.0009V10.0009L19.4142 9.58664C19.7893 9.21157 20 8.70201 20 8.17071V7C20 5.89543 19.1046 5 18 5H6ZM10 7C10.5523 7 11 7.44772 11 8V16C11 16.5523 10.5523 17 10 17C9.44772 17 9 16.5523 9 16V8C9 7.44772 9.44772 7 10 7Z" />
            </svg>
          </span>
        )}
        
        {/* Teams and Score - responsive layout */}
        <div className="grid grid-cols-3 items-center gap-2 text-center mb-6">
          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs sm:px-3 sm:py-1 sm:text-sm font-medium ${getColorClasses(match.home_team?.primary_color, match.home_team?.secondary_color)}`}>
            {match.home_team?.name || 'Unknown Team'}
          </span>
          <span className="spurs-text text-lg sm:text-xl font-semibold">{homeScore} - {awayScore}</span>
          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs sm:px-3 sm:py-1 sm:text-sm font-medium ${getColorClasses(match.away_team?.primary_color, match.away_team?.secondary_color)}`}>
            {match.away_team?.name || 'Unknown Team'}
          </span>
        </div>
      </Card>
    </Link>
  );
}
