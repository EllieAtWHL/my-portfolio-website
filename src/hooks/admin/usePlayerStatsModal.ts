import { useCallback, useState } from 'react';
import { callAdminApi } from '@/lib/api-client';
import type { PlayerStats } from '@/types/spurs-women-admin';

const emptyPlayerStatsForm: Partial<PlayerStats> = {
  player_id: '',
  match_id: '',
  team_id: 1,
  started: false,
  captain: false,
  was_substitute: false,
  was_unused_substitute: false,
  minute_on: null,
  minute_off: null,
  minutes_played: 0,
  goals: 0,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
  clean_sheet: null,
  saves: null,
  shots: 0,
  shots_on_target: 0,
  passes_completed: null,
  passes_attempted: null,
  tackles: null,
  interceptions: null,
  clearances: null,
  fouls_committed: null,
  fouls_won: null,
  offsides: null,
  player_rating: null,
  player_of_the_match: false,
};

interface UsePlayerStatsModalArgs {
  editingMatchId: string | null;
  editingPlayerId: string | null;
  setRelatedPlayerStats: (stats: PlayerStats[]) => void;
  setRelatedPlayerStatsForPlayer: (stats: PlayerStats[]) => void;
  setLoading: (loading: boolean) => void;
  showMessage: (text: string, type: 'success' | 'error') => void;
}

/**
 * Player stats are edited from both the match "related records" tab and the
 * player "related records" tab, sharing one modal. `context` tracks which
 * tab opened it, so submit/delete know which related-records list to refresh.
 */
export function usePlayerStatsModal({
  editingMatchId,
  editingPlayerId,
  setRelatedPlayerStats,
  setRelatedPlayerStatsForPlayer,
  setLoading,
  showMessage,
}: UsePlayerStatsModalArgs) {
  const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false);
  const [editingPlayerStatsId, setEditingPlayerStatsId] = useState<string | null>(null);
  const [playerStatsContext, setPlayerStatsContext] = useState<'match' | 'player'>('match');
  const [newPlayerStatsForm, setNewPlayerStatsForm] = useState<Partial<PlayerStats>>(emptyPlayerStatsForm);
  const [playerStatsFormError, setPlayerStatsFormError] = useState<string | null>(null);

  const closeModal = useCallback(() => {
    setShowPlayerStatsModal(false);
    setEditingPlayerStatsId(null);
    setPlayerStatsFormError(null);
    setNewPlayerStatsForm(emptyPlayerStatsForm);
  }, []);

  const openNew = useCallback((context: 'match' | 'player') => {
    setNewPlayerStatsForm({
      ...emptyPlayerStatsForm,
      match_id: context === 'match' ? editingMatchId! : '',
      player_id: context === 'player' ? editingPlayerId! : '',
    });
    setPlayerStatsContext(context);
    setPlayerStatsFormError(null);
    setShowPlayerStatsModal(true);
  }, [editingMatchId, editingPlayerId]);

  const openEdit = useCallback((stat: PlayerStats, context: 'match' | 'player') => {
    setEditingPlayerStatsId(stat.id);
    setNewPlayerStatsForm({ ...stat });
    setPlayerStatsContext(context);
    setPlayerStatsFormError(null);
    setShowPlayerStatsModal(true);
  }, []);

  const refreshRelatedStats = useCallback(async () => {
    const playerStatsRes = await callAdminApi('player-stats', 'GET');
    if (playerStatsRes.data) {
      const allPlayerStats = playerStatsRes.data as PlayerStats[];
      if (playerStatsContext === 'match' && editingMatchId) {
        setRelatedPlayerStats(allPlayerStats.filter(ps => ps.match_id === editingMatchId));
      } else if (playerStatsContext === 'player' && editingPlayerId) {
        setRelatedPlayerStatsForPlayer(allPlayerStats.filter(ps => ps.player_id === editingPlayerId));
      }
    }
  }, [playerStatsContext, editingMatchId, editingPlayerId, setRelatedPlayerStats, setRelatedPlayerStatsForPlayer]);

  const handleDelete = useCallback(async (playerStatsId: string) => {
    setLoading(true);
    try {
      await callAdminApi('player-stats', 'DELETE', { id: playerStatsId });
      showMessage('Player stats deleted successfully', 'success');

      try {
        await refreshRelatedStats();
      } catch (error) {
        console.error('Error reloading player stats:', error);
      }
    } catch (error) {
      console.error('Error deleting player stats:', error);
      showMessage('Error deleting player stats', 'error');
    } finally {
      setLoading(false);
    }
  }, [setLoading, showMessage, refreshRelatedStats]);

  const handleSubmit = useCallback(async () => {
    if (!newPlayerStatsForm.player_id || !newPlayerStatsForm.match_id) {
      setPlayerStatsFormError('Player and Match are both required');
      return;
    }
    try {
      setLoading(true);
      setPlayerStatsFormError(null);
      // Determine was_substitute and was_unused_substitute based on started and minute_on
      const wasSubstitute = !newPlayerStatsForm.started && newPlayerStatsForm.minute_on !== null;
      const wasUnusedSubstitute = !newPlayerStatsForm.started && newPlayerStatsForm.minute_on === null;

      const payload = {
        ...newPlayerStatsForm,
        was_substitute: wasSubstitute,
        was_unused_substitute: wasUnusedSubstitute,
      };

      const response = editingPlayerStatsId
        ? await callAdminApi('player-stats', 'PUT', { id: editingPlayerStatsId, ...payload })
        : await callAdminApi('player-stats', 'POST', payload);
      if (response.error) {
        setPlayerStatsFormError(response.error);
      } else {
        showMessage(editingPlayerStatsId ? 'Player stats updated successfully' : 'Player stats created successfully', 'success');
        closeModal();
        await refreshRelatedStats();
      }
    } catch (error) {
      setPlayerStatsFormError(editingPlayerStatsId ? 'Error updating player stats' : 'Error creating player stats');
      console.error('Error saving player stats:', error);
    } finally {
      setLoading(false);
    }
  }, [newPlayerStatsForm, editingPlayerStatsId, setLoading, showMessage, closeModal, refreshRelatedStats]);

  return {
    showPlayerStatsModal,
    editingPlayerStatsId,
    newPlayerStatsForm,
    setNewPlayerStatsForm,
    playerStatsFormError,
    openNew,
    openEdit,
    closeModal,
    handleDelete,
    handleSubmit,
  };
}
