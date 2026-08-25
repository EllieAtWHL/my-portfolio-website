'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import MatchCard from '@/components/spurs-women/MatchCard';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import PlayerTable from '@/components/spurs-women/PlayerTable';
import SpursTabButton from '@/components/spurs-women/SpursTabButton';
import { getMatchesForTeam, getPlayersForTeam, TeamPlayers } from '@/lib/data/teams';
import { Match } from '@/lib/data/matches';
import TeamPill from '@/components/spurs-women/TeamPill';
import { Team, Stadium } from '@/lib/data/stadiums';

interface TeamClientProps {
  team: Team;
  teamId: string;
  stadiums?: Stadium[];
}

// Ranks a team's home stadiums by how many of the team's matches were played there
// (rather than the stadium's all-time match count, which would include other teams' visits).
function sortStadiumsByMatchCount(stadiums: Stadium[], matches: Match[]) {
  const matchCountByStadiumId = new Map<string, number>();
  matches.forEach((match) => {
    matchCountByStadiumId.set(match.stadium_id, (matchCountByStadiumId.get(match.stadium_id) ?? 0) + 1);
  });

  return stadiums
    .map((stadium) => ({ stadium, matchCount: matchCountByStadiumId.get(stadium.id) ?? 0 }))
    .sort((a, b) => b.matchCount - a.matchCount);
}

function computeMatchRecord(matches: Match[]) {
  const scored = matches.filter(
    (match) => match.spurs_score != null && match.opponent_score != null
  );
  const wins = scored.filter((match) => match.spurs_score! > match.opponent_score!).length;
  const draws = scored.filter((match) => match.spurs_score! === match.opponent_score!).length;
  const losses = scored.filter((match) => match.spurs_score! < match.opponent_score!).length;

  return { played: scored.length, wins, draws, losses };
}

export default function TeamClient({ team, teamId, stadiums = [] }: TeamClientProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<TeamPlayers>({ current: [], former: [] });
  const [activeTab, setActiveTab] = useState<'current' | 'former'>('current');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const handleFilteredMatchesChange = useCallback((newFilteredMatches: Match[]) => {
    setFilteredMatches(newFilteredMatches);
  }, []);

  // Fetch logic stays local to the effect (rather than a shared useCallback
  // also called from the retry button) - keeps react-hooks/set-state-in-effect
  // happy, since it flags a memoized fetch function reachable from both an
  // effect and an external handler even though these setState calls only
  // ever run after the awaited request settles. Retrying bumps retryCount
  // to re-trigger this same effect.
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [matches, players] = await Promise.all([
          getMatchesForTeam(teamId),
          getPlayersForTeam(teamId)
        ]);

        setMatches(matches || []);
        setFilteredMatches(matches || []);
        setPlayers(players || { current: [], former: [] });
        setHasError(false);
      } catch (error) {
        console.error('Error loading team data:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [teamId, retryCount]);

  const retryFetchData = () => setRetryCount((count) => count + 1);

  const record = computeMatchRecord(matches);
  const rankedStadiums = sortStadiumsByMatchCount(stadiums, matches);

  return (
    <main id="main-content" className="p-4 pb-footer-clearance">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <TeamPill 
            teamName={team.name}
            primaryColor={team.primary_color}
            secondaryColor={team.secondary_color}
            className="inline-flex items-center justify-center px-4 py-2 rounded-full text-lg font-medium transition-colors"
          />
        </div>

        {/* Home Stadium(s) */}
        {stadiums.length > 0 && (
          <div className="mb-8">
            <h2 className="spurs-text font-bold mb-4">{stadiums.length > 1 ? 'Home Stadiums' : 'Home Stadium'}</h2>
            <Card variant="spursAccent" padding="md" hover={false}>
              <ul className="space-y-3">
                {rankedStadiums.map(({ stadium, matchCount }) => (
                  <li key={stadium.id} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-3 gap-y-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <Link href={`/spurs-women/stadiums/${stadium.slug}`} className="spurs-text font-medium hover:underline">
                        {stadium.name}
                      </Link>
                      {stadium.city && stadium.country && (
                        <span className="spurs-text text-sm opacity-75">
                          &middot; {stadium.city}, {stadium.country}
                        </span>
                      )}
                    </span>
                    {!isLoading && (
                      <span className="spurs-text text-sm opacity-75 whitespace-nowrap">
                        {matchCount} match{matchCount === 1 ? '' : 'es'} involving {team.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* Players Section */}
        {isLoading ? (
          <div className="mb-8">
            <h2 className="spurs-text font-bold mb-4">Players</h2>
            <Card variant="spursAccent" padding="md" hover={false}>
              <div className="flex gap-4 mb-4" role="status" aria-label="Loading players">
                <div className="h-8 w-28 rounded-full bg-gray-700 animate-pulse motion-reduce:animate-none" />
                <div className="h-8 w-28 rounded-full bg-gray-700 animate-pulse motion-reduce:animate-none" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-10 rounded bg-gray-800 animate-pulse motion-reduce:animate-none" />
                ))}
              </div>
            </Card>
          </div>
        ) : (players.current.length > 0 || players.former.length > 0) && (
          <div className="mb-8">
            <h2 className="spurs-text font-bold mb-4">Players</h2>
            <Card variant="spursAccent" padding="md" hover={false}>
              {/* Tabs */}
              <div className="flex gap-4 mb-4">
                {([
                  { key: 'current', label: 'Current', count: players.current.length },
                  { key: 'former', label: 'Former', count: players.former.length },
                ] as const).map((tab) => (
                  <SpursTabButton
                    key={tab.key}
                    isActive={activeTab === tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    disabled={tab.count === 0}
                  >
                    {tab.label} ({tab.count})
                  </SpursTabButton>
                ))}
              </div>

              {/* Tab Content */}
              <PlayerTable players={activeTab === 'current' ? players.current : players.former} />
            </Card>
          </div>
        )}

        <div className="grid gap-8">
          <div className="lg:col-span-2">
            <h2 className="spurs-text font-bold mb-4">Matches involving {team.name}</h2>

            {hasError ? (
              <ErrorState
                message="Couldn't load matches for this team. Please try again."
                onRetry={retryFetchData}
                cardVariant="spursAccent"
                buttonVariant="spurs"
              />
            ) : isLoading ? (
              <div className="grid gap-4 md:grid-cols-2" role="status" aria-label="Loading matches">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-xl bg-gray-800 animate-pulse motion-reduce:animate-none h-32"
                  />
                ))}
              </div>
            ) : (
              <>
                {record.played > 0 && (
                  <Card variant="spursAccent" padding="md" hover={false} className="mb-4">
                    <p className="spurs-text">
                      <strong>{team.is_tottenham ? 'Overall record:' : 'Head-to-head vs Tottenham:'}</strong>{' '}
                      {team.is_tottenham ? (
                        <span>
                          Wins: {record.wins} &middot; Draws: {record.draws} &middot; Losses: {record.losses}
                        </span>
                      ) : (
                        <span>
                          Tottenham wins: {record.wins} &middot; Draws: {record.draws} &middot; {team.name} wins: {record.losses}
                        </span>
                      )}
                    </p>
                  </Card>
                )}

                <MatchFilterControls
                  matches={matches}
                  onFilteredMatchesChange={handleFilteredMatchesChange}
                  showCompetitionFilter={true}
                  showVenueFilter={true}
                  showAttendedFilter={true}
                  showResultFilter={true}
                  showMonthFilter={false}
                />

                {filteredMatches.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <Card variant="spursAccent" padding="md" hover={false}>
                    <p className="spurs-text">
                      No matches found for this team.
                    </p>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
