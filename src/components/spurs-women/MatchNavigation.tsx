'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Match } from '@/lib/data/matches';

interface MatchNavigationProps {
  previousMatch: Match | null;
  nextMatch: Match | null;
  currentMatch: Match;
  headerFontSize: string;
}

export default function MatchNavigation({ 
  previousMatch, 
  nextMatch, 
  currentMatch,
  headerFontSize 
}: MatchNavigationProps) {
  const router = useRouter();

  const navigateToMatch = (matchId: string) => {
    router.push(`/spurs-women/matches/${matchId}`);
  };

  const homeScore = currentMatch.is_home_match ? (currentMatch.spurs_score ?? '') : (currentMatch.opponent_score ?? '');
  const awayScore = currentMatch.is_home_match ? (currentMatch.opponent_score ?? '') : (currentMatch.spurs_score ?? '');

  return (
    <>
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
            {previousMatch ? `${previousMatch.home_team?.short_name} vs ${previousMatch.away_team?.short_name}` : 'No Previous Match'}
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
            {nextMatch ? `${nextMatch.home_team?.short_name} vs ${nextMatch.away_team?.short_name}` : 'No Next Match'}
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
            {previousMatch ? `${previousMatch.home_team?.short_name} vs ${previousMatch.away_team?.short_name}` : 'No Previous Match'}
          </div>
        </Button>

        {/* Match header (team names and score) in the middle */}
        <h1 className={`spurs-text font-bold flex items-center gap-2 sm:gap-4 flex-wrap text-center ${headerFontSize}`}
            style={{
              fontSize: headerFontSize === 'text-lg' ? '1.625rem' : 
                       headerFontSize === 'text-xl' ? '1.875rem' : '2rem'
            }}>
          <span>
            {currentMatch.home_team?.name}
          </span>
          <span className="text-gray-500">{homeScore} - {awayScore}</span>
          <span>
            {currentMatch.away_team?.name}
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
            {nextMatch ? `${nextMatch.home_team?.short_name} vs ${nextMatch.away_team?.short_name}` : 'No Next Match'}
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Button>
      </div>

      {/* Mobile match header - centered below buttons */}
      <div className="sm:hidden mb-4">
        <h1 className={`spurs-text font-bold flex items-center justify-center gap-2 flex-wrap text-center ${headerFontSize}`}
            style={{
              fontSize: headerFontSize === 'text-lg' ? '1.5rem' : 
                       headerFontSize === 'text-xl' ? '1.75rem' : '1.875rem'
            }}>
          <span>
            {currentMatch.home_team?.name}
          </span>
          <span className="text-gray-500">{homeScore} - {awayScore}</span>
          <span>
            {currentMatch.away_team?.name}
          </span>
        </h1>
      </div>
    </>
  );
}
