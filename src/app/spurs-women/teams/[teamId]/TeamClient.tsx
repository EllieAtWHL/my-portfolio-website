'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/Card';
import MatchCard from '@/components/spurs-women/MatchCard';
import MatchFilterControls from '@/components/spurs-women/MatchFilterControls';
import PlayerTable from '@/components/spurs-women/PlayerTable';
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

  const handleFilteredMatchesChange = useCallback((newFilteredMatches: Match[]) => {
    setFilteredMatches(newFilteredMatches);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const [matches, players] = await Promise.all([
        getMatchesForTeam(teamId),
        getPlayersForTeam(teamId)
      ]);

      setMatches(matches || []);
      setFilteredMatches(matches || []);
      setPlayers(players || { current: [], former: [] });
    };

    fetchData();
  }, [teamId]);

  return (
    <main className="p-4 pb-24">
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
        {(players.current.length > 0 || players.former.length > 0) && (
          <div className="mb-8">
            <h2 className="spurs-text font-bold mb-4">Players</h2>
            <Card variant="spursAccent" padding="md" hover={false}>
              {/* Tabs */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setActiveTab('current')}
                  className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
                    activeTab === 'current'
                      ? 'text-[var(--spurs-dark-accent)]'
                      : 'text-gray-300 hover:text-[var(--spurs-dark-accent)]'
                  }`}
                  style={{
                    '--tab-bg': activeTab === 'current' ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
                    '--tab-border-color': activeTab === 'current' ? 'var(--spurs-dark-accent)' : 'transparent',
                    '--tab-border-width': activeTab === 'current' ? '2px' : '0',
                    '--tab-color': activeTab === 'current' ? 'var(--spurs-dark-accent)' : '#d1d5db',
                    backgroundColor: 'var(--tab-bg)',
                    borderBottomColor: 'var(--tab-border-color)',
                    borderBottomWidth: 'var(--tab-border-width)',
                    color: 'var(--tab-color)'
                  } as React.CSSProperties}
                  disabled={players.current.length === 0}
                >
                  Current ({players.current.length})
                </button>
                <button
                  onClick={() => setActiveTab('former')}
                  className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
                    activeTab === 'former'
                      ? 'text-[var(--spurs-dark-accent)]'
                      : 'text-gray-300 hover:text-[var(--spurs-dark-accent)]'
                  }`}
                  style={{
                    '--tab-bg': activeTab === 'former' ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
                    '--tab-border-color': activeTab === 'former' ? 'var(--spurs-dark-accent)' : 'transparent',
                    '--tab-border-width': activeTab === 'former' ? '2px' : '0',
                    '--tab-color': activeTab === 'former' ? 'var(--spurs-dark-accent)' : '#d1d5db',
                    backgroundColor: 'var(--tab-bg)',
                    borderBottomColor: 'var(--tab-border-color)',
                    borderBottomWidth: 'var(--tab-border-width)',
                    color: 'var(--tab-color)'
                  } as React.CSSProperties}
                  disabled={players.former.length === 0}
                >
                  Former ({players.former.length})
                </button>
              </div>

              {/* Tab Content */}
              <PlayerTable players={activeTab === 'current' ? players.current : players.former} />
            </Card>
          </div>
        )}

        <div className="grid gap-8">
          <div className="lg:col-span-2">
            <h2 className="spurs-text font-bold mb-4">Matches involving {team.name}</h2>
            
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
                <p className="text-gray-600">
                  No matches found for this team.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
