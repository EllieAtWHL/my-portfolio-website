import { renderHook, act } from '@testing-library/react';
import { usePlayersAdmin } from '../usePlayersAdmin';
import { callAdminApi } from '@/lib/api-client';
import type { Player, PlayerHistory } from '@/types/spurs-women-admin';

jest.mock('@/lib/api-client', () => ({
  callAdminApi: jest.fn(),
}));

const mockCallAdminApi = callAdminApi as jest.Mock;

const alice: Player = {
  id: 'player-1',
  first_name: 'Alice',
  last_name: 'Smith',
  date_of_birth: null,
  nationality: 'England',
  position: 'Forward',
  height_cm: null,
  weight_kg: null,
  profile_image_url: null,
  squad_number: null,
  is_active: true,
  created_at: '',
  updated_at: '',
};

const history: PlayerHistory = {
  id: 'history-1',
  player_id: 'player-1',
  team_id: 1,
  joined_on: '2023-01-01',
  left_on: null,
  squad_number: 9,
};

function setup(players: Player[] = [alice]) {
  const setPlayers = jest.fn();
  const setLoading = jest.fn();
  const showMessage = jest.fn();
  const { result } = renderHook(() => usePlayersAdmin({ players, setPlayers, setLoading, showMessage }));
  return { result, setPlayers, setLoading, showMessage };
}

describe('usePlayersAdmin', () => {
  beforeEach(() => {
    mockCallAdminApi.mockReset();
    global.fetch = jest.fn();
    window.scrollTo = jest.fn();
  });

  it('populates the form and fetches related records when editing a player', async () => {
    mockCallAdminApi
      .mockResolvedValueOnce({ data: [] }) // player-stats
      .mockResolvedValueOnce({ data: [history] }); // player-history
    const { result } = setup();

    await act(async () => {
      await result.current.handleEditPlayer(alice);
    });

    expect(result.current.isPlayerEditMode).toBe(true);
    expect(result.current.playerForm.last_name).toBe('Smith');
    expect(result.current.relatedPlayerHistory).toEqual([history]);
  });

  it('resets edit mode on cancel', () => {
    const { result } = setup();

    act(() => result.current.setShowPlayerForm(true));
    act(() => result.current.handleCancelEditPlayer());

    expect(result.current.isPlayerEditMode).toBe(false);
    expect(result.current.showPlayerForm).toBe(false);
    expect(result.current.playerForm.last_name).toBe('');
  });

  it('deletes a player and reloads the list', async () => {
    mockCallAdminApi
      .mockResolvedValueOnce({}) // DELETE
      .mockResolvedValueOnce({ data: [] }); // reload GET
    const { result, setPlayers, showMessage } = setup();

    await act(async () => {
      await result.current.handleDeletePlayer('player-1');
    });

    expect(mockCallAdminApi).toHaveBeenCalledWith('players', 'DELETE', { id: 'player-1' });
    expect(showMessage).toHaveBeenCalledWith('Player deleted successfully', 'success');
    expect(setPlayers).toHaveBeenCalledWith([]);
  });

  describe('player history modal', () => {
    it('opens pre-filled with the selected history record', () => {
      const { result } = setup();

      act(() => result.current.openEditPlayerHistory(history));

      expect(result.current.showPlayerHistoryModal).toBe(true);
      expect(result.current.editingPlayerHistoryId).toBe('history-1');
      expect(result.current.playerHistoryForm.squad_number).toBe(9);
    });

    it('requires a joined_on date before submitting', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.handlePlayerHistorySubmit();
      });

      expect(result.current.playerHistoryFormError).toBe('Joined On is required');
      expect(mockCallAdminApi).not.toHaveBeenCalled();
    });

    it('creates a new history record and closes the modal', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: { id: 'history-2' } }) // POST
        .mockResolvedValueOnce({ data: [history] }); // reload GET
      const { result, showMessage } = setup();

      act(() => result.current.openNewPlayerHistory());
      act(() => result.current.setPlayerHistoryForm({ ...result.current.playerHistoryForm, joined_on: '2024-01-01' }));

      await act(async () => {
        await result.current.handlePlayerHistorySubmit();
      });

      expect(showMessage).toHaveBeenCalledWith('Player history created successfully', 'success');
      expect(result.current.showPlayerHistoryModal).toBe(false);
    });

    it('deletes a history record', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({ data: [] }); // reload GET
      const { result, showMessage } = setup();

      await act(async () => {
        await result.current.handleDeletePlayerHistory('history-1');
      });

      expect(mockCallAdminApi).toHaveBeenCalledWith('player-history', 'DELETE', { id: 'history-1' });
      expect(showMessage).toHaveBeenCalledWith('Player history deleted successfully', 'success');
    });
  });

  it('filters and paginates the passed-in players list', () => {
    const bob: Player = { ...alice, id: 'player-2', first_name: 'Bob', last_name: 'Jones', nationality: 'Wales' };
    const { result } = setup([alice, bob]);

    act(() => result.current.setSearch('jones'));

    expect(result.current.filteredCount).toBe(1);
    expect(result.current.paginatedItems).toEqual([bob]);
  });
});
