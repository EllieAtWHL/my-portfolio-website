'use client';

import { useState, useEffect, useCallback } from 'react';
import { callAdminApi } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { TabNav } from '@/components/admin/TabNav';
import { PlayerStatsModal } from '@/components/admin/modals/PlayerStatsModal';
import { MatchesTabPanel } from '@/components/admin/panels/MatchesTabPanel';
import { TeamsTabPanel } from '@/components/admin/panels/TeamsTabPanel';
import { PlayersTabPanel } from '@/components/admin/panels/PlayersTabPanel';
import { StadiumsTabPanel } from '@/components/admin/panels/StadiumsTabPanel';
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
  Player,
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
  const matchesAdmin = useMatchesAdmin({ matches, setMatches, teams, stadiums, stadiumNames, setLoading, showMessage });
  const teamsAdmin = useTeamsAdmin({ teams, setTeams, setLoading, showMessage });
  const playersAdmin = usePlayersAdmin({ players, setPlayers, setLoading, showMessage });
  const stadiumsAdmin = useStadiumsAdmin({ recentStadiums, setStadiums, setRecentStadiums, setStadiumNames, setLoading, showMessage });

  const {
    isEditMode,
    editingMatchId,
    showMatchForm,
    setShowMatchForm,
    handleCancelEdit,
    setRelatedPlayerStats,
    resetTabState: resetMatchesTab,
  } = matchesAdmin;
  const {
    isTeamEditMode,
    showTeamForm,
    setShowTeamForm,
    handleCancelEditTeam,
    resetTabState: resetTeamsTab,
  } = teamsAdmin;
  const {
    isPlayerEditMode,
    editingPlayerId,
    showPlayerForm,
    setShowPlayerForm,
    handleCancelEditPlayer,
    setRelatedPlayerStatsForPlayer,
    resetTabState: resetPlayersTab,
  } = playersAdmin;
  const {
    isStadiumEditMode,
    showStadiumForm,
    setShowStadiumForm,
    handleCancelEditStadium,
    resetTabState: resetStadiumsTab,
  } = stadiumsAdmin;

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

        {/* Message Display - fixed above modals (z-50) so it's visible even while one is open.
            role="status"/"alert" carry implicit aria-live polite/assertive, so screen reader
            users get this announced even though it auto-dismisses after 3s with no focus change. */}
        {message && (
          <div
            role={message.type === 'success' ? 'status' : 'alert'}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] p-4 rounded shadow-lg ${
              message.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
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

        {activeTab === 'matches' && (
          <MatchesTabPanel
            matchesAdmin={matchesAdmin}
            seasons={seasons}
            competitions={competitions}
            teams={teams}
            stadiums={stadiums}
            players={players}
            loading={loading}
            openNewPlayerStats={openNewPlayerStats}
            openEditPlayerStats={openEditPlayerStats}
          />
        )}

        {activeTab === 'teams' && (
          <TeamsTabPanel teamsAdmin={teamsAdmin} loading={loading} />
        )}

        {activeTab === 'players' && (
          <PlayersTabPanel
            playersAdmin={playersAdmin}
            teams={teams}
            matches={matches}
            loading={loading}
            openNewPlayerStats={openNewPlayerStats}
            openEditPlayerStats={openEditPlayerStats}
          />
        )}

        {activeTab === 'stadiums' && (
          <StadiumsTabPanel stadiumsAdmin={stadiumsAdmin} teams={teams} loading={loading} />
        )}
      </div>

      {/* Player Stats Modal - shared between the Matches and Players tabs
          (see usePlayerStatsModal), so it stays here rather than in either panel */}
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
    </main>
  );
}
