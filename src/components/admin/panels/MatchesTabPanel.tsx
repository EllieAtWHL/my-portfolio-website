'use client';

import { MatchForm } from '@/components/admin/MatchForm';
import { MediaModal } from '@/components/admin/modals/MediaModal';
import { RelatedList } from '@/components/admin/RelatedList';
import { TabNav } from '@/components/admin/TabNav';
import { Pagination } from '@/components/admin/Pagination';
import { MatchesTable } from '@/components/admin/tables/MatchesTable';
import { useMatchesAdmin } from '@/hooks/admin/useMatchesAdmin';
import type { Competition, Media, Player, PlayerStats, Season, Stadium, Team } from '@/types/spurs-women-admin';

interface MatchesTabPanelProps {
  matchesAdmin: ReturnType<typeof useMatchesAdmin>;
  seasons: Season[];
  competitions: Competition[];
  teams: Team[];
  stadiums: Stadium[];
  players: Player[];
  loading: boolean;
  openNewPlayerStats: (context: 'match' | 'player') => void;
  openEditPlayerStats: (stat: PlayerStats, context: 'match' | 'player') => void;
}

export function MatchesTabPanel({
  matchesAdmin,
  seasons,
  competitions,
  teams,
  stadiums,
  players,
  loading,
  openNewPlayerStats,
  openEditPlayerStats,
}: MatchesTabPanelProps) {
  const {
    search: matchSearch,
    setSearch: setMatchSearch,
    currentPage: matchesCurrentPage,
    setCurrentPage: setMatchesCurrentPage,
    totalPages: matchesTotalPages,
    filteredCount: filteredMatchesCount,
    paginatedItems: paginatedMatches,
    perPage: matchesPerPage,
    isEditMode,
    editingMatchId,
    showMatchForm,
    matchForm,
    setMatchForm,
    matchEditTab,
    setMatchEditTab,
    showExtraTimeSection,
    setShowExtraTimeSection,
    showStatsSection,
    setShowStatsSection,
    relatedPlayerStats,
    getMediaByType,
    handleEditMatch,
    handleCancelEdit,
    handleDeleteMatch,
    handleMatchSubmit,
    showMediaModal,
    editingMediaId,
    newMediaForm,
    setNewMediaForm,
    openNewMedia,
    openEditMedia,
    closeMediaModal,
    handleDeleteMedia,
    handleMediaSubmit,
    getCurrentStadiumName,
  } = matchesAdmin;

  return (
    <>
      {isEditMode && (
        <TabNav
          className="mb-4 flex space-x-2"
          tabs={[
            { key: 'details', label: 'Details', panelId: 'match-details-panel' },
            { key: 'related', label: 'Related Records', panelId: 'match-related-panel' },
          ]}
          activeKey={matchEditTab}
          onChange={setMatchEditTab}
        />
      )}

      {matchEditTab === 'details' && (isEditMode || showMatchForm) && (
        <div id="match-details-panel" role="tabpanel" aria-labelledby="tab-details">
          <MatchForm
            matchForm={matchForm}
            setMatchForm={setMatchForm}
            seasons={seasons}
            competitions={competitions}
            teams={teams}
            stadiums={stadiums}
            isEditMode={isEditMode}
            editingMatchId={editingMatchId}
            loading={loading}
            showStatsSection={showStatsSection}
            showExtraTimeSection={showExtraTimeSection}
            setShowStatsSection={setShowStatsSection}
            setShowExtraTimeSection={setShowExtraTimeSection}
            getCurrentStadiumName={getCurrentStadiumName}
            onSubmit={handleMatchSubmit}
            onDelete={() => {
              if (confirm('Are you sure you want to delete this match?')) {
                handleDeleteMatch(editingMatchId!);
              }
            }}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {matchEditTab === 'related' && isEditMode && (
        <div id="match-related-panel" role="tabpanel" aria-labelledby="tab-related" className="space-y-4">
          {/* Media related lists grouped by type */}
          {Object.entries(getMediaByType()).map(([mediaType, mediaRecords]) => (
            <RelatedList
              key={mediaType}
              title={`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`}
              records={mediaRecords}
              columns={[
                { key: 'title', label: 'Title' },
                { key: 'url', label: 'URL', render: (value: unknown) => {
                  const url = value as string;
                  return (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="spurs-text hover:underline">
                      {url.length > 50 ? `${url.substring(0, 50)}...` : url}
                    </a>
                  );
                }},
                { key: 'sort_order', label: 'Sort Order' },
              ]}
              onNew={() => openNewMedia(mediaType as Media['type'])}
              onRecordClick={openEditMedia}
              emptyMessage={`No ${mediaType} records found`}
            />
          ))}

          {/* Player Stats related list */}
          <RelatedList
            title="Player Stats"
            records={relatedPlayerStats}
            columns={[
              {
                key: 'player_id',
                label: 'Player',
                render: (value: unknown) => {
                  const playerId = value as string;
                  const player = players.find(p => p.id === playerId);
                  return player ? `${player.first_name} ${player.last_name}` : playerId;
                }
              },
              { key: 'started', label: 'Started', render: (value: unknown) => (value as boolean) ? 'Yes' : 'No' },
              { key: 'captain', label: 'Captain', render: (value: unknown) => (value as boolean) ? 'Yes' : 'No' },
              { key: 'goals', label: 'Goals' },
              { key: 'assists', label: 'Assists' },
            ]}
            onNew={() => openNewPlayerStats('match')}
            onRecordClick={(stat) => openEditPlayerStats(stat, 'match')}
            emptyMessage="No player stats records found"
          />
        </div>
      )}

      {/* Recent Records Preview */}
      <div className="mt-8 spurs-accent-card rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold spurs-text">
            {matchSearch ? `All Matches (${filteredMatchesCount} filtered)` : 'All Matches'}
          </h3>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search matches by date, opponent, or stadium..."
            value={matchSearch}
            onChange={(e) => setMatchSearch(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <MatchesTable matches={paginatedMatches} teams={teams} competitions={competitions} onSelect={handleEditMatch} />
        <Pagination
          currentPage={matchesCurrentPage}
          totalPages={matchesTotalPages}
          totalItems={filteredMatchesCount}
          perPage={matchesPerPage}
          itemLabel="matches"
          onPageChange={setMatchesCurrentPage}
        />
      </div>

      {/* Media Modal */}
      {showMediaModal && (
        <MediaModal
          editingMediaId={editingMediaId}
          form={newMediaForm}
          onChange={setNewMediaForm}
          onCancel={closeMediaModal}
          onDelete={() => {
            if (editingMediaId && confirm('Are you sure you want to delete this media item?')) {
              handleDeleteMedia(editingMediaId);
              closeMediaModal();
            }
          }}
          onSubmit={handleMediaSubmit}
        />
      )}
    </>
  );
}
