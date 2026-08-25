import { useCallback, useState } from 'react';
import { useSearchPagination } from '@/hooks/useSearchPagination';
import { callAdminApi } from '@/lib/api-client';
import type { Player, PlayerStats, PlayerHistory } from '@/types/spurs-women-admin';

const PLAYERS_PER_PAGE = 20;

const emptyPlayerForm: Partial<Player> = {
  first_name: '',
  last_name: '',
  date_of_birth: null,
  nationality: null,
  position: null,
  height_cm: null,
  weight_kg: null,
  profile_image_url: null,
};

const emptyPlayerHistoryForm: Partial<PlayerHistory> = {
  player_id: '',
  team_id: 1,
  joined_on: null,
  left_on: null,
  squad_number: null,
};

interface UsePlayersAdminArgs {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  setLoading: (loading: boolean) => void;
  showMessage: (text: string, type: 'success' | 'error') => void;
}

export function usePlayersAdmin({ players, setPlayers, setLoading, showMessage }: UsePlayersAdminArgs) {
  const playerFilterFn = useCallback((player: Player, search: string) => {
    const searchTerm = search.toLowerCase();
    return (
      player.first_name?.toLowerCase().includes(searchTerm) ||
      player.last_name?.toLowerCase().includes(searchTerm) ||
      player.position?.toLowerCase().includes(searchTerm) ||
      player.nationality?.toLowerCase().includes(searchTerm)
    );
  }, []);
  const search = useSearchPagination(players, playerFilterFn, PLAYERS_PER_PAGE);

  const [isPlayerEditMode, setIsPlayerEditMode] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [playerForm, setPlayerForm] = useState<Partial<Player>>(emptyPlayerForm);
  const [playerEditTab, setPlayerEditTab] = useState<'details' | 'related'>('details');

  const [relatedPlayerStatsForPlayer, setRelatedPlayerStatsForPlayer] = useState<PlayerStats[]>([]);
  const [relatedPlayerHistory, setRelatedPlayerHistory] = useState<PlayerHistory[]>([]);

  const [showPlayerHistoryModal, setShowPlayerHistoryModal] = useState(false);
  const [editingPlayerHistoryId, setEditingPlayerHistoryId] = useState<string | null>(null);
  const [playerHistoryForm, setPlayerHistoryForm] = useState<Partial<PlayerHistory>>(emptyPlayerHistoryForm);
  const [playerHistoryFormError, setPlayerHistoryFormError] = useState<string | null>(null);

  const handleCancelEditPlayer = useCallback(() => {
    setIsPlayerEditMode(false);
    setShowPlayerForm(false);
    setEditingPlayerId(null);
    setPlayerForm(emptyPlayerForm);
  }, []);

  const handleEditPlayer = useCallback(async (player: Player) => {
    setIsPlayerEditMode(true);
    setShowPlayerForm(true);
    setEditingPlayerId(player.id);
    setPlayerEditTab('details');
    window.scrollTo({ top: 250, left: 0, behavior: 'smooth' });

    try {
      const [playerStatsRes, playerHistoryRes] = await Promise.all([
        callAdminApi('player-stats', 'GET'),
        callAdminApi('player-history', 'GET'),
      ]);

      if (playerStatsRes.data) {
        const allPlayerStats = playerStatsRes.data as PlayerStats[];
        setRelatedPlayerStatsForPlayer(allPlayerStats.filter(ps => ps.player_id === player.id));
      }

      if (playerHistoryRes.data) {
        const allPlayerHistory = playerHistoryRes.data as PlayerHistory[];
        setRelatedPlayerHistory(allPlayerHistory.filter(ph => ph.player_id === player.id));
      }
    } catch (error) {
      console.error('Error fetching related records:', error);
    }
    setPlayerForm({
      first_name: player.first_name,
      last_name: player.last_name,
      date_of_birth: player.date_of_birth,
      nationality: player.nationality,
      position: player.position,
      height_cm: player.height_cm,
      weight_kg: player.weight_kg,
      profile_image_url: player.profile_image_url,
    });
  }, []);

  const handleDeletePlayer = useCallback(async (playerId: string) => {
    setLoading(true);
    try {
      await callAdminApi('players', 'DELETE', { id: playerId });
      showMessage('Player deleted successfully', 'success');

      try {
        const playersResponse = await callAdminApi('players', 'GET');
        if (playersResponse.data) setPlayers(playersResponse.data as Player[]);
      } catch (error) {
        console.error('Error reloading players:', error);
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      showMessage('Error deleting player', 'error');
    } finally {
      setLoading(false);
    }
  }, [setLoading, showMessage, setPlayers]);

  const handlePlayerSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        first_name: playerForm.first_name || null,
        last_name: playerForm.last_name,
        date_of_birth: playerForm.date_of_birth || null,
        nationality: playerForm.nationality || null,
        position: playerForm.position || null,
        height_cm: playerForm.height_cm || null,
        weight_kg: playerForm.weight_kg || null,
        profile_image_url: playerForm.profile_image_url || null,
      };

      let response;
      if (isPlayerEditMode && editingPlayerId) {
        response = await fetch('/api/admin/players', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPlayerId, ...payload }),
        });
      } else {
        response = await fetch('/api/admin/players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isPlayerEditMode ? 'update' : 'create'} player`);
      }

      showMessage(isPlayerEditMode ? 'Player updated successfully' : 'Player created successfully', 'success');

      handleCancelEditPlayer();

      try {
        const playersResponse = await fetch('/api/admin/players');
        const playersResult = await playersResponse.json();
        if (playersResult.data) setPlayers(playersResult.data as Player[]);
      } catch (error) {
        console.error('Error reloading players:', error);
      }
    } catch (error) {
      console.error(`Error ${isPlayerEditMode ? 'updating' : 'creating'} player:`, error);

      let errorMessage = isPlayerEditMode ? 'Error updating player' : 'Error creating player';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `${isPlayerEditMode ? 'Error updating player' : 'Error creating player'}: ${error.message}`;
        } else if ('code' in error) {
          errorMessage = `${isPlayerEditMode ? 'Error updating player' : 'Error creating player'}: ${error.code}`;
        } else {
          errorMessage = `${isPlayerEditMode ? 'Error updating player' : 'Error creating player'}: ${JSON.stringify(error)}`;
        }
      } else if (typeof error === 'string') {
        errorMessage = `${isPlayerEditMode ? 'Error updating player' : 'Error creating player'}: ${error}`;
      }

      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [playerForm, isPlayerEditMode, editingPlayerId, setLoading, showMessage, handleCancelEditPlayer, setPlayers]);

  const closePlayerHistoryModal = useCallback(() => {
    setShowPlayerHistoryModal(false);
    setEditingPlayerHistoryId(null);
    setPlayerHistoryFormError(null);
    setPlayerHistoryForm({ player_id: '', team_id: 1, joined_on: '', left_on: '', squad_number: null });
  }, []);

  const openNewPlayerHistory = useCallback(() => {
    setPlayerHistoryForm({ player_id: editingPlayerId!, team_id: 1, joined_on: '', left_on: '', squad_number: null });
    setEditingPlayerHistoryId(null);
    setPlayerHistoryFormError(null);
    setShowPlayerHistoryModal(true);
  }, [editingPlayerId]);

  const openEditPlayerHistory = useCallback((history: PlayerHistory) => {
    setEditingPlayerHistoryId(history.id);
    setPlayerHistoryForm({
      player_id: history.player_id,
      team_id: history.team_id,
      joined_on: history.joined_on,
      left_on: history.left_on,
      squad_number: history.squad_number,
    });
    setPlayerHistoryFormError(null);
    setShowPlayerHistoryModal(true);
  }, []);

  const handleDeletePlayerHistory = useCallback(async (playerHistoryId: string) => {
    setLoading(true);
    try {
      await callAdminApi('player-history', 'DELETE', { id: playerHistoryId });
      showMessage('Player history deleted successfully', 'success');

      try {
        const playerHistoryResponse = await callAdminApi('player-history', 'GET');
        if (playerHistoryResponse.data) {
          const allPlayerHistory = playerHistoryResponse.data as PlayerHistory[];
          setRelatedPlayerHistory(allPlayerHistory.filter(ph => ph.player_id === editingPlayerId));
        }
      } catch (error) {
        console.error('Error reloading player history:', error);
      }
    } catch (error) {
      console.error('Error deleting player history:', error);
      showMessage('Error deleting player history', 'error');
    } finally {
      setLoading(false);
    }
  }, [setLoading, showMessage, editingPlayerId]);

  const handlePlayerHistorySubmit = useCallback(async () => {
    if (!playerHistoryForm.joined_on) {
      setPlayerHistoryFormError('Joined On is required');
      return;
    }
    try {
      setLoading(true);
      setPlayerHistoryFormError(null);
      const payload = {
        ...playerHistoryForm,
        left_on: playerHistoryForm.left_on || null,
      };
      const response = editingPlayerHistoryId
        ? await callAdminApi('player-history', 'PUT', { id: editingPlayerHistoryId, ...payload })
        : await callAdminApi('player-history', 'POST', payload);
      if (response.error) {
        setPlayerHistoryFormError(response.error);
      } else {
        showMessage(editingPlayerHistoryId ? 'Player history updated successfully' : 'Player history created successfully', 'success');
        closePlayerHistoryModal();
        const playerHistoryRes = await callAdminApi('player-history', 'GET');
        if (playerHistoryRes.data) {
          const allPlayerHistory = playerHistoryRes.data as PlayerHistory[];
          setRelatedPlayerHistory(allPlayerHistory.filter(ph => ph.player_id === editingPlayerId));
        }
      }
    } catch (error) {
      setPlayerHistoryFormError(editingPlayerHistoryId ? 'Error updating player history' : 'Error creating player history');
      console.error('Error saving player history:', error);
    } finally {
      setLoading(false);
    }
  }, [playerHistoryForm, editingPlayerHistoryId, editingPlayerId, setLoading, showMessage, closePlayerHistoryModal]);

  const resetTabState = useCallback(() => {
    setIsPlayerEditMode(false);
    setEditingPlayerId(null);
    setShowPlayerForm(false);
    search.setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...search,
    perPage: PLAYERS_PER_PAGE,
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
    resetTabState,
    // Player history modal
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
  };
}
