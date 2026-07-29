'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/Button';
import { Match, MatchNavSummary } from '@/lib/data/matches';
import TeamPill from '@/components/spurs-women/TeamPill';

interface MatchNavigationProps {
  previousMatch: MatchNavSummary | null;
  nextMatch: MatchNavSummary | null;
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
  const [isPending, startTransition] = useTransition();
  const [pendingDirection, setPendingDirection] = useState<'previous' | 'next' | null>(null);

  const navigateToMatch = (matchId: string | undefined, direction: 'previous' | 'next') => {
    if (!matchId) return;
    setPendingDirection(direction);
    startTransition(() => {
      router.push(`/spurs-women/matches/${matchId}`);
    });
  };

  const getTeamDisplayName = (team: { short_name?: string; name?: string } | null) => {
    return team?.short_name || team?.name || 'Unknown Team';
  };

  // Swaps the directional arrow for a same-size spinner in place, so the
  // button's row layout (and height) never changes between states.
  const renderNavIcon = (direction: 'previous' | 'next', sizeClasses: string) => {
    if (isPending && pendingDirection === direction) {
      return <span className={`${sizeClasses} inline-block animate-spin rounded-full border-b-2 border-current`} />;
    }

    const path = direction === 'previous' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7';
    return (
      <svg className={sizeClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
      </svg>
    );
  };

  const homeScore = currentMatch.is_home_match ? (currentMatch.spurs_score ?? '') : (currentMatch.opponent_score ?? '');
  const awayScore = currentMatch.is_home_match ? (currentMatch.opponent_score ?? '') : (currentMatch.spurs_score ?? '');
  const homeScoreAet = currentMatch.is_home_match ? (currentMatch.spurs_score_aet ?? null) : (currentMatch.opponent_score_aet ?? null);
  const awayScoreAet = currentMatch.is_home_match ? (currentMatch.opponent_score_aet ?? null) : (currentMatch.spurs_score_aet ?? null);
  const homeScorePens = currentMatch.is_home_match ? (currentMatch.spurs_score_pens ?? null) : (currentMatch.opponent_score_pens ?? null);
  const awayScorePens = currentMatch.is_home_match ? (currentMatch.opponent_score_pens ?? null) : (currentMatch.spurs_score_pens ?? null);
  
  // Determine if we need to show AET/PENS bracket scores
  const hasAetScores = homeScoreAet !== null && awayScoreAet !== null;
  const hasPensScores = homeScorePens !== null && awayScorePens !== null;
  
  // Build the score display string with individual brackets
  let homeDisplay = homeScore;
  let awayDisplay = awayScore;
  
  if (hasPensScores) {
    homeDisplay = `(${homeScorePens}) ${homeScore}`;
    awayDisplay = `${awayScore} (${awayScorePens})`;
  } else if (hasAetScores) {
    homeDisplay = `(${homeScoreAet}) ${homeScore}`;
    awayDisplay = `${awayScore} (${awayScoreAet})`;
  }
  
  const scoreDisplay = `${homeDisplay} - ${awayDisplay}`;
  
  // Determine the label to show under the score
  const scoreLabel = hasPensScores ? 'PENS' : (hasAetScores ? 'AET' : null);

  return (
    <>
      {/* Mobile navigation buttons - stacked and centered */}
      <div className="flex flex-col gap-2 sm:hidden mb-4 items-center">
        {/* Previous match button */}
        <Button
          variant="spurs"
          onClick={() => navigateToMatch(previousMatch?.id, 'previous')}
          disabled={!previousMatch || isPending}
          className="text-sm !px-4 !py-3 w-11/12 justify-start"
        >
          <div className="flex items-center">
            <span className="mr-2">{renderNavIcon('previous', 'w-4 h-4')}</span>
            {previousMatch ? `${getTeamDisplayName(previousMatch.home_team)} vs ${getTeamDisplayName(previousMatch.away_team)}` : 'No Previous Match'}
          </div>
        </Button>

        {/* Next match button */}
        <Button
          variant="spurs"
          onClick={() => navigateToMatch(nextMatch?.id, 'next')}
          disabled={!nextMatch || isPending}
          className="text-sm !px-4 !py-3 w-11/12 justify-end"
        >
          <div className="flex items-center">
            {nextMatch ? `${getTeamDisplayName(nextMatch.home_team)} vs ${getTeamDisplayName(nextMatch.away_team)}` : 'No Next Match'}
            <span className="ml-2">{renderNavIcon('next', 'w-4 h-4')}</span>
          </div>
        </Button>
      </div>

      {/* Desktop navigation and header - side by side */}
      <div className="hidden sm:flex justify-between items-center gap-4 mb-1">
        {/* Left navigation button */}
        <Button
          variant="spurs"
          onClick={() => navigateToMatch(previousMatch?.id, 'previous')}
          disabled={!previousMatch || isPending}
          size="sm"
          className="text-xs !px-2 !py-1 !text-xs"
          style={{ padding: '0.25rem 0.5rem !important', fontSize: '0.75rem !important' }}
        >
          <div className="flex items-center">
            <span className="mr-1">{renderNavIcon('previous', 'w-3 h-3')}</span>
            {previousMatch ? `${getTeamDisplayName(previousMatch.home_team)} vs ${getTeamDisplayName(previousMatch.away_team)}` : 'No Previous Match'}
          </div>
        </Button>

        {/* Match header (team names and score) in the middle */}
        <h1 className={`spurs-text font-bold flex items-center gap-2 sm:gap-4 flex-wrap text-center ${headerFontSize}`}
            style={{
              fontSize: headerFontSize === 'text-lg' ? '1.625rem' : 
                       headerFontSize === 'text-xl' ? '1.875rem' : '2rem'
            }}>
          <TeamPill 
            teamName={currentMatch.home_team?.name || 'Unknown Team'}
            primaryColor={currentMatch.home_team?.primary_color}
            secondaryColor={currentMatch.home_team?.secondary_color}
          />
          <div className="flex flex-col items-center">
            <span className="text-gray-500">{scoreDisplay}</span>
            {scoreLabel && (
              <span className="text-xs text-gray-400 mt-1">{scoreLabel}</span>
            )}
          </div>
          <TeamPill 
            teamName={currentMatch.away_team?.name || 'Unknown Team'}
            primaryColor={currentMatch.away_team?.primary_color}
            secondaryColor={currentMatch.away_team?.secondary_color}
          />
        </h1>

        {/* Right navigation button */}
        <Button
          variant="spurs"
          onClick={() => navigateToMatch(nextMatch?.id, 'next')}
          disabled={!nextMatch || isPending}
          size="sm"
          className="text-xs !px-2 !py-1 !text-xs"
          style={{ padding: '0.25rem 0.5rem !important', fontSize: '0.75rem !important' }}
        >
          <div className="flex items-center">
            {nextMatch ? `${getTeamDisplayName(nextMatch.home_team)} vs ${getTeamDisplayName(nextMatch.away_team)}` : 'No Next Match'}
            <span className="ml-1">{renderNavIcon('next', 'w-3 h-3')}</span>
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
          <div className="flex flex-col items-center">
            <span className="text-gray-500">{scoreDisplay}</span>
            {scoreLabel && (
              <span className="text-xs text-gray-400 mt-1">{scoreLabel}</span>
            )}
          </div>
          <span>
            {currentMatch.away_team?.name}
          </span>
        </h1>
      </div>
    </>
  );
}
