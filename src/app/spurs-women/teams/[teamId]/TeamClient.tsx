'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import MatchCard from '@/components/spurs-women/MatchCard';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import PlayerTable from '@/components/spurs-women/PlayerTable';
import SpursTabButton from '@/components/spurs-women/SpursTabButton';
import { getMatchesForTeam, getPlayersForTeam, TeamPlayers } from '@/lib/data/teams';
import { Match } from '@/lib/data/matches';
import TeamPill from '@/components/spurs-women/TeamPill';
import { Team } from '@/lib/data/stadiums';

interface TeamClientProps {
  team: Team;
  teamId: string;
}

export default function TeamClient({ team, teamId }: TeamClientProps) {
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
