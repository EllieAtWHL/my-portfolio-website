import Link from 'next/link';
import { Card } from '@/components/Card';
import { CompetitionIcon } from '@/components/spurs-women/CompetitionIcon';
import { formatDateForCard } from '@/lib/utils/date';
import { Match } from '@/lib/data/matches';
import TeamPill from '@/components/spurs-women/TeamPill';

type MatchProps = {
  match: Match;
};

export default function MatchCard({ match }: MatchProps) {
  const homeScore = match.is_home_match ? (match.spurs_score ?? '') : (match.opponent_score ?? '');
  const awayScore = match.is_home_match ? (match.opponent_score ?? '') : (match.spurs_score ?? '');
  const homeScoreAet = match.is_home_match ? (match.spurs_score_aet ?? null) : (match.opponent_score_aet ?? null);
  const awayScoreAet = match.is_home_match ? (match.opponent_score_aet ?? null) : (match.spurs_score_aet ?? null);
  const homeScorePens = match.is_home_match ? (match.spurs_score_pens ?? null) : (match.opponent_score_pens ?? null);
  const awayScorePens = match.is_home_match ? (match.opponent_score_pens ?? null) : (match.spurs_score_pens ?? null);
  
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
    <Link href={`/spurs-women/matches/${match.id}`} className="block spurs-text h-full">
      <Card variant="spursAccent" padding="md" clickable={true} className="h-full">
        <div className="text-center text-sm spurs-text mb-2 flex justify-center items-center gap-4">
          {formatDateForCard(match.date)}
          {match.competitions?.name && (
            <span className="spurs-text" title={match.competitions.name}>
              <CompetitionIcon iconSvg={match.competitions.icon_svg} className="w-4 h-4" />
            </span>
          )}
        </div>

        {new Date(match.date) < new Date() && match.attended && (
          <span className="absolute top-2 right-2 spurs-text" title="Attended">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M6 5C4.89543 5 4 5.89543 4 7V8.17071C4 8.70201 4.21071 9.21157 4.58579 9.58664L5 10.0009V14.0009L4.58579 14.4151C4.21071 14.7902 4 15.2997 4 15.831V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V15.831C20 15.2997 19.7893 14.7902 19.4142 14.4151L19 14.0009V10.0009L19.4142 9.58664C19.7893 9.21157 20 8.70201 20 8.17071V7C20 5.89543 19.1046 5 18 5H6ZM10 7C10.5523 7 11 7.44772 11 8V16C11 16.5523 10.5523 17 10 17C9.44772 17 9 16.5523 9 16V8C9 7.44772 9.44772 7 10 7Z" />
            </svg>
          </span>
        )}
        
        <div className="grid grid-cols-3 items-center gap-2 text-center mb-4">
          <TeamPill 
            teamName={match.home_team?.name || 'Unknown Team'}
            primaryColor={match.home_team?.primary_color}
            secondaryColor={match.home_team?.secondary_color}
            className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs sm:px-3 sm:py-1 sm:text-sm font-medium transition-colors"
          />
          <div className="flex flex-col items-center">
            <span className="spurs-text text-lg sm:text-xl font-semibold">{scoreDisplay}</span>
            {scoreLabel && (
              <span className="text-xs spurs-text opacity-75 mt-1">{scoreLabel}</span>
            )}
          </div>
          <TeamPill 
            teamName={match.away_team?.name || 'Unknown Team'}
            primaryColor={match.away_team?.primary_color}
            secondaryColor={match.away_team?.secondary_color}
            className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs sm:px-3 sm:py-1 sm:text-sm font-medium transition-colors"
          />
        </div>

        {match.stadium_display_name && (
          <div className="text-center text-xs spurs-text opacity-75">
            {match.stadium_display_name}
          </div>
        )}
      </Card>
    </Link>
  );
}
