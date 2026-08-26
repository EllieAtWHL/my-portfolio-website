'use client';

import { PlayerForm } from '@/components/admin/PlayerForm';
import { PlayerHistoryModal } from '@/components/admin/modals/PlayerHistoryModal';
import { RelatedList } from '@/components/admin/RelatedList';
import { TabNav } from '@/components/admin/TabNav';
import { Pagination } from '@/components/admin/Pagination';
import { PlayersTable } from '@/components/admin/tables/PlayersTable';
import { usePlayersAdmin } from '@/hooks/admin/usePlayersAdmin';
import type { Match, PlayerStats, Team } from '@/types/spurs-women-admin';

interface PlayersTabPanelProps {
  playersAdmin: ReturnType<typeof usePlayersAdmin>;
  teams: Team[];
  matches: Match[];
  loading: boolean;
  openNewPlayerStats: (context: 'match' | 'player') => void;
  openEditPlayerStats: (stat: PlayerStats, context: 'match' | 'player') => void;
}

export function PlayersTabPanel({
  playersAdmin,
  teams,
  matches,
  loading,
  openNewPlayerStats,
  openEditPlayerStats,
}: PlayersTabPanelProps) {
  const {
    search: playerSearch,
    setSearch: setPlayerSearch,
    currentPage: playersCurrentPage,
    setCurrentPage: setPlayersCurrentPage,
    totalPages: playersTotalPages,
    filteredCount: filteredPlayersCount,
    paginatedItems: paginatedPlayers,
    perPage: playersPerPage,
    isPlayerEditMode,
    editingPlayerId,
    showPlayerForm,
    playerForm,
    setPlayerForm,
    playerEditTab,
    setPlayerEditTab,
    relatedPlayerStatsForPlayer,
    relatedPlayerHistory,
    handleEditPlayer,
    handleCancelEditPlayer,
    handleDeletePlayer,
    handlePlayerSubmit,
    showPlayerHistoryModal,
    editingPlayerHistoryId,
    playerHistoryForm,
    setPlayerHistoryForm,
    playerHistoryFormError,
    openNewPlayerHistory,
    openEditPlayerHistory,
    closePlayerHistoryModal,
    handleDeletePlayerHistory,
    handlePlayerHistorySubmit,
  } = playersAdmin;

  return (
    <>
      {isPlayerEditMode && (
        <TabNav
          className="mb-4 flex space-x-2"
          tabs={[
            { key: 'details', label: 'Details', panelId: 'player-details-panel' },
            { key: 'related', label: 'Related Records', panelId: 'player-related-panel' },
          ]}
          activeKey={playerEditTab}
          onChange={setPlayerEditTab}
        />
      )}

      {playerEditTab === 'details' && (isPlayerEditMode || showPlayerForm) && (
        <div id="player-details-panel" role="tabpanel" aria-labelledby="tab-details">
          <PlayerForm
            playerForm={playerForm}
            setPlayerForm={setPlayerForm}
            isPlayerEditMode={isPlayerEditMode}
            editingPlayerId={editingPlayerId}
            loading={loading}
            onSubmit={handlePlayerSubmit}
            onDelete={() => {
              if (editingPlayerId && confirm('Are you sure you want to delete this player?')) {
                handleDeletePlayer(editingPlayerId);
              }
            }}
            onCancel={handleCancelEditPlayer}
          />
        </div>
      )}

      {playerEditTab === 'related' && isPlayerEditMode && (
        <div id="player-related-panel" role="tabpanel" aria-labelledby="tab-related" className="space-y-4">
          {/* Player Stats related list */}
          <RelatedList
            title="Player Stats"
            records={relatedPlayerStatsForPlayer}
            columns={[
              {
                key: 'match_id',
                label: 'Match',
                render: (value: unknown) => {
                  const matchId = value as string;
                  const match = matches.find(m => m.id === matchId);
                  return match ? `${match.date}` : matchId;
                }
              },
              {
                key: 'match_id',
                id: 'opponent',
                label: 'Opponent',
                render: (value: unknown, stat: PlayerStats) => {
                  const match = matches.find(m => m.id === (value as string));
                  if (!match) return '-';
                  const opponentTeamId = match.home_team_id === stat.team_id
                    ? match.away_team_id
                    : match.home_team_id;
                  const opponentTeam = teams.find(t => t.id === opponentTeamId);
                  return opponentTeam?.short_name || opponentTeam?.name || '-';
                }
              },
              { key: 'started', label: 'Started', render: (value: unknown) => (value as boolean) ? 'Yes' : 'No' },
              { key: 'goals', label: 'Goals' },
              { key: 'assists', label: 'Assists' },
            ]}
            onNew={() => openNewPlayerStats('player')}
            onRecordClick={(stat) => openEditPlayerStats(stat, 'player')}
            emptyMessage="No player stats records found"
          />

          {/* Player History related list */}
          <RelatedList
            title="Player History"
            records={relatedPlayerHistory}
            columns={[
              {
                key: 'team_id',
                label: 'Team',
                render: (value: unknown) => {
                  const teamId = value as number;
                  const team = teams.find(t => t.id === teamId);
                  return team ? team.name : teamId.toString();
                }
              },
              { key: 'joined_on', label: 'Joined On' },
              { key: 'left_on', label: 'Left On' },
              { key: 'squad_number', label: 'Squad Number' },
            ]}
            onNew={openNewPlayerHistory}
            onRecordClick={openEditPlayerHistory}
            emptyMessage="No player history records found"
          />
        </div>
      )}

      {/* Recent Records Preview */}
      <div className="mt-8 spurs-accent-card rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold spurs-text">
            {playerSearch ? `All Players (${filteredPlayersCount} filtered)` : 'All Players'}
          </h3>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search players by name, position, or nationality..."
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <PlayersTable players={paginatedPlayers} onSelect={handleEditPlayer} />
        <Pagination
          currentPage={playersCurrentPage}
          totalPages={playersTotalPages}
          totalItems={filteredPlayersCount}
          perPage={playersPerPage}
          itemLabel="players"
          onPageChange={setPlayersCurrentPage}
        />
      </div>

      {/* Player History Modal */}
      {showPlayerHistoryModal && (
        <PlayerHistoryModal
          editingPlayerHistoryId={editingPlayerHistoryId}
          form={playerHistoryForm}
          onChange={setPlayerHistoryForm}
          error={playerHistoryFormError}
          teams={teams}
          onCancel={closePlayerHistoryModal}
          onDelete={() => {
            if (editingPlayerHistoryId && confirm('Are you sure you want to delete this player history record?')) {
              handleDeletePlayerHistory(editingPlayerHistoryId);
              closePlayerHistoryModal();
            }
          }}
          onSubmit={handlePlayerHistorySubmit}
        />
      )}
    </>
  );
}
