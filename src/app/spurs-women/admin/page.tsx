'use client';

import { useState, useEffect, useCallback } from 'react';
import { callAdminApi } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { MatchForm } from '@/components/admin/MatchForm';
import { TeamForm } from '@/components/admin/TeamForm';
import { PlayerForm } from '@/components/admin/PlayerForm';
import { StadiumForm } from '@/components/admin/StadiumForm';
import { RelatedList } from '@/components/admin/RelatedList';
import { TabNav } from '@/components/admin/TabNav';
import { Pagination } from '@/components/admin/Pagination';
import { MatchesTable } from '@/components/admin/tables/MatchesTable';
import { TeamsTable } from '@/components/admin/tables/TeamsTable';
import { PlayersTable } from '@/components/admin/tables/PlayersTable';
import { StadiumsTable } from '@/components/admin/tables/StadiumsTable';
import { MediaModal } from '@/components/admin/modals/MediaModal';
import { PlayerStatsModal } from '@/components/admin/modals/PlayerStatsModal';
import { PlayerHistoryModal } from '@/components/admin/modals/PlayerHistoryModal';
import { StadiumNameModal } from '@/components/admin/modals/StadiumNameModal';
import { useTeamsAdmin } from '@/hooks/admin/useTeamsAdmin';
import { usePlayersAdmin } from '@/hooks/admin/usePlayersAdmin';
import { useStadiumsAdmin } from '@/hooks/admin/useStadiumsAdmin';
import { useMatchesAdmin } from '@/hooks/admin/useMatchesAdmin';
import { usePlayerStatsModal } from '@/hooks/admin/usePlayerStatsModal';
import type {
  Team,
  Competition,
  Season,
  Match,
  Media,
  Player,
  PlayerStats,
  Stadium,
  StadiumName,
} from '@/types/spurs-women-admin';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'matches' | 'teams' | 'players' | 'stadiums'>('matches');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Dropdown data
  const [teams, setTeams] = useState<Team[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [stadiumNames, setStadiumNames] = useState<StadiumName[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // Recent records for each entity type
  const [recentStadiums, setRecentStadiums] = useState<Stadium[]>([]);

  // Search + pagination for each entity list. Stadiums search the
  // separately-fetched `recentStadiums` (loaded per-tab), not `stadiums`
  // (the full dropdown list used elsewhere for stadium selects).
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
    setShowMatchForm,
    matchForm,
    setMatchForm,
    matchEditTab,
    setMatchEditTab,
    showExtraTimeSection,
    setShowExtraTimeSection,
    showStatsSection,
    setShowStatsSection,
    relatedPlayerStats,
    setRelatedPlayerStats,
    getMediaByType,
    handleEditMatch,
    handleCancelEdit,
    handleDeleteMatch,
    handleMatchSubmit,
    resetTabState: resetMatchesTab,
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
  } = useMatchesAdmin({ matches, setMatches, teams, stadiums, stadiumNames, setLoading, showMessage });
  const {
    search: teamSearch,
    setSearch: setTeamSearch,
    currentPage: teamsCurrentPage,
    setCurrentPage: setTeamsCurrentPage,
    totalPages: teamsTotalPages,
    filteredCount: filteredTeamsCount,
    paginatedItems: paginatedTeams,
    perPage: teamsPerPage,
    isTeamEditMode,
    editingTeamId,
    showTeamForm,
    setShowTeamForm,
    teamForm,
    setTeamForm,
    handleEditTeam,
    handleCancelEditTeam,
    handleDeleteTeam,
    handleTeamSubmit,
    resetTabState: resetTeamsTab,
  } = useTeamsAdmin({ teams, setTeams, setLoading, showMessage });
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
    setShowPlayerForm,
    playerForm,
    setPlayerForm,
    playerEditTab,
    setPlayerEditTab,
    relatedPlayerStatsForPlayer,
    setRelatedPlayerStatsForPlayer,
    relatedPlayerHistory,
    handleEditPlayer,
    handleCancelEditPlayer,
    handleDeletePlayer,
    handlePlayerSubmit,
    resetTabState: resetPlayersTab,
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
  } = usePlayersAdmin({ players, setPlayers, setLoading, showMessage });
  const {
    search: stadiumSearch,
    setSearch: setStadiumSearch,
    currentPage: stadiumsCurrentPage,
    setCurrentPage: setStadiumsCurrentPage,
    totalPages: stadiumsTotalPages,
    filteredCount: filteredStadiumsCount,
    paginatedItems: paginatedStadiums,
    perPage: stadiumsPerPage,
    isStadiumEditMode,
    editingStadiumId,
    showStadiumForm,
    setShowStadiumForm,
    stadiumForm,
    setStadiumForm,
    stadiumEditTab,
    setStadiumEditTab,
    relatedStadiumNames,
    handleEditStadium,
    handleCancelEditStadium,
    handleDeleteStadium,
    handleStadiumSubmit,
    resetTabState: resetStadiumsTab,
    showStadiumNameModal,
    editingStadiumNameId,
    stadiumNameForm,
    setStadiumNameForm,
    stadiumNameFormError,
    openNewStadiumName,
    openEditStadiumName,
    closeStadiumNameModal,
    handleDeleteStadiumName,
    handleStadiumNameSubmit,
  } = useStadiumsAdmin({ recentStadiums, setStadiums, setRecentStadiums, setStadiumNames, setLoading, showMessage });

  const {
    showPlayerStatsModal,
    editingPlayerStatsId,
    newPlayerStatsForm,
    setNewPlayerStatsForm,
    playerStatsFormError,
    openNew: openNewPlayerStats,
    openEdit: openEditPlayerStats,
    closeModal: closePlayerStatsModal,
    handleDelete: handleDeletePlayerStats,
    handleSubmit: handlePlayerStatsSubmit,
  } = usePlayerStatsModal({
    editingMatchId,
    editingPlayerId,
    setRelatedPlayerStats,
    setRelatedPlayerStatsForPlayer,
    setLoading,
    showMessage,
  });

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ email: user.email! });
      }
    };
    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/spurs-women/login');
  };

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      setLoading(true);
      try {
        // Load all dropdown data via API calls
        const [matchesRes, teamsRes, competitionsRes, seasonsRes, playersRes, stadiumsRes, stadiumNamesRes] = await Promise.all([
          callAdminApi('matches', 'GET'),
          callAdminApi('teams', 'GET'),
          callAdminApi('competitions', 'GET'),
          callAdminApi('seasons', 'GET'),
          callAdminApi('players', 'GET'),
          callAdminApi('stadia', 'GET'),
          callAdminApi('stadium-names', 'GET'),
        ]);

        if (teamsRes.data) setTeams(teamsRes.data as Team[]);
        if (competitionsRes.data) setCompetitions(competitionsRes.data as Competition[]);
        if (seasonsRes.data) setSeasons(seasonsRes.data as Season[]);
        if (matchesRes.data) setMatches(matchesRes.data as Match[]);
        if (stadiumsRes.data) {
          setStadiums(stadiumsRes.data as Stadium[]);
        } else {
          console.warn('No stadiums data');
        }
        if (stadiumNamesRes.data) setStadiumNames(stadiumNamesRes.data as StadiumName[]);
        if (playersRes.data) {
          setPlayers(playersRes.data as Player[]);
        } else {
          console.warn('No players data received');
        }
      } catch (error) {
        showMessage('Error loading data', 'error');
        console.error('Error loading dropdown data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDropdownData();
  }, []);

  // Functions to fetch recent records for each entity type
  const fetchRecentRecords = useCallback(async () => {
    try {

      // Determine which table to fetch based on active tab
      let tableName = '';
      
      switch (activeTab) {
        case 'players':
          tableName = 'players';
          break;
        case 'stadiums':
          tableName = 'stadia';
          break;
        case 'matches':
        case 'teams':
        default:
          // Matches and teams are already loaded separately
          return;
      }

      if (tableName) {
        // Fetch data via API - map table names to API endpoint names
        const apiEndpointMap: Record<string, string> = {
          'stadia': 'stadia',
        };
        const apiEndpoint = apiEndpointMap[tableName] || tableName;
        const dataRes = await callAdminApi(apiEndpoint, 'GET');

        // Set the appropriate state based on the active tab (store ALL data, not paginated)
        if (dataRes.data) {
          switch (activeTab) {
            case 'stadiums':
              setRecentStadiums(dataRes.data as Stadium[]);
              break;
          }
        } else {
          switch (activeTab) {
            case 'stadiums':
              setRecentStadiums([]);
              break;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching recent records:', error);
    }
  }, [activeTab, setRecentStadiums]);

  // Reset pagination and edit modes when tab changes (adjusting state during
  // render, per https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const [prevActiveTab, setPrevActiveTab] = useState(activeTab);
  if (activeTab !== prevActiveTab) {
    setPrevActiveTab(activeTab);
    resetMatchesTab();
    resetTeamsTab();
    resetPlayersTab();
    resetStadiumsTab();
  }

  // Fetch recent records whenever the active tab changes. fetchRecentRecords
  // only sets state after its internal `await`, so this is a standard async
  // data-fetch effect, not a synchronous setState call.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecentRecords();
  }, [activeTab, fetchRecentRecords]);

  return (
    <main id="main-content" className="p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
          <h1 className="spurs-text font-bold">Spurs Women Admin</h1>
          {user && (
            <div className="flex flex-wrap items-center justify-end gap-4">
              <Link href="/spurs-women/profile" className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'var(--spurs-dark-accent)' }}>
                {user.email}
              </Link>
              <Button
                variant="spurs"
                size="sm"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>

        {/* Message Display - fixed above modals (z-50) so it's visible even while one is open */}
        {message && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] p-4 rounded shadow-lg ${
            message.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-between items-center border-b border-gray-600 mb-8 gap-2">
          <TabNav
            tabs={[
              { key: 'matches', label: 'Matches' },
              { key: 'teams', label: 'Teams' },
              { key: 'players', label: 'Players' },
              { key: 'stadiums', label: 'Stadiums' },
            ]}
            activeKey={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === 'matches' && !isEditMode && (
            <Button className="mb-2" variant="spurs" size="sm" onClick={() => (showMatchForm ? handleCancelEdit() : setShowMatchForm(true))}>
              {showMatchForm ? 'Cancel' : '+ New Match'}
            </Button>
          )}
          {activeTab === 'teams' && !isTeamEditMode && (
            <Button className="mb-2" variant="spurs" size="sm" onClick={() => (showTeamForm ? handleCancelEditTeam() : setShowTeamForm(true))}>
              {showTeamForm ? 'Cancel' : '+ New Team'}
            </Button>
          )}
          {activeTab === 'players' && !isPlayerEditMode && (
            <Button className="mb-2" variant="spurs" size="sm" onClick={() => (showPlayerForm ? handleCancelEditPlayer() : setShowPlayerForm(true))}>
              {showPlayerForm ? 'Cancel' : '+ New Player'}
            </Button>
          )}
          {activeTab === 'stadiums' && !isStadiumEditMode && (
            <Button className="mb-2" variant="spurs" size="sm" onClick={() => (showStadiumForm ? handleCancelEditStadium() : setShowStadiumForm(true))}>
              {showStadiumForm ? 'Cancel' : '+ New Stadium'}
            </Button>
          )}
        </div>

        {/* Match Form */}
        {activeTab === 'matches' && (
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
          </>
        )}

        {/* Team Form */}
        {activeTab === 'teams' && (
          <>
            {(isTeamEditMode || showTeamForm) && (
              <TeamForm
                teamForm={teamForm}
                setTeamForm={setTeamForm}
                isTeamEditMode={isTeamEditMode}
                editingTeamId={editingTeamId}
                loading={loading}
                onSubmit={handleTeamSubmit}
                onDelete={() => {
                  if (editingTeamId && confirm('Are you sure you want to delete this team?')) {
                    handleDeleteTeam(editingTeamId);
                  }
                }}
                onCancel={handleCancelEditTeam}
              />
            )}
          </>
        )}

        {/* Player Form */}
        {activeTab === 'players' && (
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
          </>
        )}

        {/* Stadium Form */}
        {activeTab === 'stadiums' && (
          <>
            {isStadiumEditMode && (
              <TabNav
                className="mb-4 flex space-x-2"
                tabs={[
                  { key: 'details', label: 'Details', panelId: 'stadium-details-panel' },
                  { key: 'related', label: 'Related Records', panelId: 'stadium-related-panel' },
                ]}
                activeKey={stadiumEditTab}
                onChange={setStadiumEditTab}
              />
            )}

            {stadiumEditTab === 'details' && (isStadiumEditMode || showStadiumForm) && (
              <div id="stadium-details-panel" role="tabpanel" aria-labelledby="tab-details">
              <StadiumForm
                teams={teams}
                stadiumForm={stadiumForm}
                setStadiumForm={setStadiumForm}
                isStadiumEditMode={isStadiumEditMode}
                editingStadiumId={editingStadiumId}
                loading={loading}
                onSubmit={handleStadiumSubmit}
                onDelete={() => {
                  if (editingStadiumId && confirm('Are you sure you want to delete this stadium?')) {
                    handleDeleteStadium(editingStadiumId);
                  }
                }}
                onCancel={handleCancelEditStadium}
              />
              </div>
            )}

            {stadiumEditTab === 'related' && isStadiumEditMode && (
              <div id="stadium-related-panel" role="tabpanel" aria-labelledby="tab-related" className="space-y-4">
                {/* Stadium Names related list */}
                <RelatedList
                  title="Stadium Names"
                  records={relatedStadiumNames}
                  columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'valid_from', label: 'Valid From' },
                    { key: 'valid_to', label: 'Valid To' },
                  ]}
                  onNew={openNewStadiumName}
                  onRecordClick={openEditStadiumName}
                  emptyMessage="No stadium names found"
                />
              </div>
            )}
          </>
        )}

        {/* Recent Records Preview */}
        <div className="mt-8 spurs-accent-card rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold spurs-text">
              {activeTab === 'matches'
                ? (matchSearch ? `All Matches (${filteredMatchesCount} filtered)` : 'All Matches')
                : activeTab === 'teams' ? (teamSearch ? `All Teams (${filteredTeamsCount} filtered)` : 'All Teams') :
                activeTab === 'players' ? (playerSearch ? `All Players (${filteredPlayersCount} filtered)` : 'All Players') :
                activeTab === 'stadiums' ? (stadiumSearch ? `All Stadiums (${filteredStadiumsCount} filtered)` : 'All Stadiums') :
                'Recent Records'}
            </h3>
          </div>
          {activeTab === 'matches' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search matches by date, opponent, or stadium..."
                value={matchSearch}
                onChange={(e) => setMatchSearch(e.target.value)}
                className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {activeTab === 'teams' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search teams by name or short name..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {activeTab === 'players' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search players by name, position, or nationality..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {activeTab === 'stadiums' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search stadiums by name, slug, city, or country..."
                value={stadiumSearch}
                onChange={(e) => setStadiumSearch(e.target.value)}
                className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {activeTab === 'matches' && (
            <MatchesTable matches={paginatedMatches} teams={teams} competitions={competitions} onSelect={handleEditMatch} />
          )}
          {activeTab === 'teams' && (
            <TeamsTable teams={paginatedTeams} onSelect={handleEditTeam} />
          )}
          {activeTab === 'players' && (
            <PlayersTable players={paginatedPlayers} onSelect={handleEditPlayer} />
          )}
          {activeTab === 'stadiums' && (
            <StadiumsTable stadiums={paginatedStadiums} onSelect={handleEditStadium} />
          )}

          {/* Pagination Controls */}
          {activeTab === 'matches' && (
            <Pagination
              currentPage={matchesCurrentPage}
              totalPages={matchesTotalPages}
              totalItems={filteredMatchesCount}
              perPage={matchesPerPage}
              itemLabel="matches"
              onPageChange={setMatchesCurrentPage}
            />
          )}
          {activeTab === 'teams' && (
            <Pagination
              currentPage={teamsCurrentPage}
              totalPages={teamsTotalPages}
              totalItems={filteredTeamsCount}
              perPage={teamsPerPage}
              itemLabel="teams"
              onPageChange={setTeamsCurrentPage}
            />
          )}
          {activeTab === 'players' && (
            <Pagination
              currentPage={playersCurrentPage}
              totalPages={playersTotalPages}
              totalItems={filteredPlayersCount}
              perPage={playersPerPage}
              itemLabel="players"
              onPageChange={setPlayersCurrentPage}
            />
          )}
          {activeTab === 'stadiums' && (
            <Pagination
              currentPage={stadiumsCurrentPage}
              totalPages={stadiumsTotalPages}
              totalItems={filteredStadiumsCount}
              perPage={stadiumsPerPage}
              itemLabel="stadiums"
              onPageChange={setStadiumsCurrentPage}
            />
          )}
        </div>
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

      {/* Player Stats Modal */}
      {showPlayerStatsModal && (
        <PlayerStatsModal
          editingPlayerStatsId={editingPlayerStatsId}
          form={newPlayerStatsForm}
          onChange={setNewPlayerStatsForm}
          error={playerStatsFormError}
          players={players}
          matches={matches}
          teams={teams}
          onCancel={closePlayerStatsModal}
          onDelete={() => {
            if (editingPlayerStatsId && confirm('Are you sure you want to delete this player stats record?')) {
              handleDeletePlayerStats(editingPlayerStatsId);
              closePlayerStatsModal();
            }
          }}
          onSubmit={handlePlayerStatsSubmit}
        />
      )}

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

      {/* Stadium Name Modal */}
      {showStadiumNameModal && (
        <StadiumNameModal
          editingStadiumNameId={editingStadiumNameId}
          form={stadiumNameForm}
          onChange={setStadiumNameForm}
          error={stadiumNameFormError}
          onCancel={closeStadiumNameModal}
          onDelete={() => {
            if (editingStadiumNameId && confirm('Are you sure you want to delete this stadium name?')) {
              handleDeleteStadiumName(editingStadiumNameId);
              closeStadiumNameModal();
            }
          }}
          onSubmit={handleStadiumNameSubmit}
        />
      )}
    </main>
  );
}
