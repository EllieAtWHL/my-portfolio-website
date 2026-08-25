import { renderHook, act } from '@testing-library/react';
import { usePlayersAdmin } from '../usePlayersAdmin';
import { callAdminApi } from '@/lib/api-client';
import type { Player, PlayerHistory, PlayerStats } from '@/types/spurs-women-admin';

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
  created_at: '',
  updated_at: '',
};

const bob: Player = {
  ...alice,
  id: 'player-2',
  first_name: 'Bob',
  last_name: 'Jones',
  nationality: 'Wales',
  position: 'Defender',
};

const emptyPlayerFormShape = {
  first_name: '',
  last_name: '',
  date_of_birth: null,
  nationality: null,
  position: null,
  height_cm: null,
  weight_kg: null,
  profile_image_url: null,
};

const emptyPlayerHistoryFormShape = {
  player_id: '',
  team_id: 1,
  joined_on: null,
  left_on: null,
  squad_number: null,
};

const history: PlayerHistory = {
  id: 'history-1',
  player_id: 'player-1',
  team_id: 1,
  joined_on: '2023-01-01',
  left_on: null,
  squad_number: 9,
};

const historyOther: PlayerHistory = {
  id: 'history-2',
  player_id: 'player-2',
  team_id: 1,
  joined_on: '2022-01-01',
  left_on: null,
  squad_number: 4,
};

function statsFor(player_id: string, id: string): PlayerStats {
  return {
    id,
    player_id,
    match_id: 'match-1',
    team_id: 1,
    started: true,
    captain: false,
    was_substitute: false,
    was_unused_substitute: false,
    minute_on: null,
    minute_off: null,
    minutes_played: 90,
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
    created_at: '',
  };
}

const statsAlice = statsFor('player-1', 'ps-1');
const statsBob = statsFor('player-2', 'ps-2');

function fetchOk(body: unknown) {
  return { ok: true, json: async () => body } as Response;
}
function fetchErr(body: unknown) {
  return { ok: false, json: async () => body } as Response;
}
const fakeEvent = { preventDefault: () => {} } as React.FormEvent;

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

  it('starts with the exact default player and player-history form shapes', () => {
    const { result } = setup();

    expect(result.current.playerForm).toEqual(emptyPlayerFormShape);
    expect(result.current.playerHistoryForm).toEqual(emptyPlayerHistoryFormShape);
    expect(result.current.isPlayerEditMode).toBe(false);
    expect(result.current.showPlayerForm).toBe(false);
    expect(result.current.editingPlayerId).toBeNull();
  });

  describe('playerFilterFn / search', () => {
    it('matches case-insensitively on first name, last name, position, and nationality', () => {
      const { result } = setup([alice, bob]);

      act(() => result.current.setSearch('jones'));
      expect(result.current.paginatedItems).toEqual([bob]);

      act(() => result.current.setSearch('defender'));
      expect(result.current.paginatedItems).toEqual([bob]);

      act(() => result.current.setSearch('wales'));
      expect(result.current.paginatedItems).toEqual([bob]);

      act(() => result.current.setSearch('bob'));
      expect(result.current.paginatedItems).toEqual([bob]);
    });

    it('does not throw when a player has a null last_name, and still filters correctly', () => {
      const noLastName: Player = { ...alice, id: 'player-3', first_name: 'Charlie', last_name: null as unknown as string };
      const { result } = setup([alice, bob, noLastName]);

      expect(() => act(() => result.current.setSearch('charlie'))).not.toThrow();

      expect(result.current.filteredCount).toBe(1);
      expect(result.current.paginatedItems).toEqual([noLastName]);
    });

    it('excludes non-matching players rather than coincidentally returning everyone', () => {
      const { result } = setup([alice, bob]);

      act(() => result.current.setSearch('smith'));

      expect(result.current.filteredCount).toBe(1);
      expect(result.current.paginatedItems).toEqual([alice]);
    });
  });

  describe('handleEditPlayer', () => {
    it('populates the form, scrolls, and fetches only the matching related records', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: [statsAlice, statsBob] }) // player-stats
        .mockResolvedValueOnce({ data: [history, historyOther] }); // player-history
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditPlayer(alice);
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'player-stats', 'GET');
      expect(mockCallAdminApi).toHaveBeenNthCalledWith(2, 'player-history', 'GET');
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 250, left: 0, behavior: 'smooth' });
      expect(result.current.isPlayerEditMode).toBe(true);
      expect(result.current.showPlayerForm).toBe(true);
      expect(result.current.editingPlayerId).toBe('player-1');
      expect(result.current.playerForm).toEqual({
        first_name: 'Alice',
        last_name: 'Smith',
        date_of_birth: null,
        nationality: 'England',
        position: 'Forward',
        height_cm: null,
        weight_kg: null,
        profile_image_url: null,
      });
      // Disambiguating fixtures: only alice's records should survive the filter.
      expect(result.current.relatedPlayerStatsForPlayer).toEqual([statsAlice]);
      expect(result.current.relatedPlayerHistory).toEqual([history]);
    });

    it('leaves related records empty when the API responses have no data', async () => {
      mockCallAdminApi.mockResolvedValueOnce({}).mockResolvedValueOnce({});
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditPlayer(alice);
      });

      expect(result.current.relatedPlayerStatsForPlayer).toEqual([]);
      expect(result.current.relatedPlayerHistory).toEqual([]);
    });

    it('still populates the form when fetching related records fails', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('network down'));
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditPlayer(alice);
      });

      expect(result.current.playerForm.last_name).toBe('Smith');
      expect(result.current.relatedPlayerStatsForPlayer).toEqual([]);
      expect(result.current.relatedPlayerHistory).toEqual([]);
    });
  });

  it('resets edit mode and the form to the exact default shape on cancel', () => {
    const { result } = setup();

    act(() => result.current.setShowPlayerForm(true));
    act(() => result.current.handleCancelEditPlayer());

    expect(result.current.isPlayerEditMode).toBe(false);
    expect(result.current.showPlayerForm).toBe(false);
    expect(result.current.editingPlayerId).toBeNull();
    expect(result.current.playerForm).toEqual(emptyPlayerFormShape);
  });

  describe('handleDeletePlayer', () => {
    it('deletes a player, shows a success message, and reloads the list', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({ data: [bob] }); // reload GET
      const { result, setPlayers, setLoading, showMessage } = setup();

      await act(async () => {
        await result.current.handleDeletePlayer('player-1');
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'players', 'DELETE', { id: 'player-1' });
      expect(mockCallAdminApi).toHaveBeenNthCalledWith(2, 'players', 'GET');
      expect(showMessage).toHaveBeenCalledWith('Player deleted successfully', 'success');
      expect(setPlayers).toHaveBeenCalledWith([bob]);
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });

    it('does not call setPlayers when the reload response has no data', async () => {
      mockCallAdminApi.mockResolvedValueOnce({}).mockResolvedValueOnce({});
      const { result, setPlayers } = setup();

      await act(async () => {
        await result.current.handleDeletePlayer('player-1');
      });

      expect(setPlayers).not.toHaveBeenCalled();
    });

    it('shows an error message and still stops loading when the delete call fails', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('boom'));
      const { result, setLoading, showMessage } = setup();

      await act(async () => {
        await result.current.handleDeletePlayer('player-1');
      });

      expect(showMessage).toHaveBeenCalledWith('Error deleting player', 'error');
      expect(setLoading).toHaveBeenLastCalledWith(false);
    });
  });

  describe('handlePlayerSubmit', () => {
    it('creates a player with the provided fields and reloads the list', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(fetchOk({ data: { id: 'player-9' } })) // POST
        .mockResolvedValueOnce(fetchOk({ data: [bob] })); // reload GET
      const { result, setPlayers, setLoading, showMessage } = setup();

      act(() =>
        result.current.setPlayerForm({
          first_name: 'Jane',
          last_name: 'Doe',
          date_of_birth: '2000-01-01',
          nationality: 'Spain',
          position: 'Midfielder',
          height_cm: 170,
          weight_kg: 65,
          profile_image_url: 'http://img.example/jane.png',
        })
      );

      await act(async () => {
        await result.current.handlePlayerSubmit(fakeEvent);
      });

      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: 'Jane',
          last_name: 'Doe',
          date_of_birth: '2000-01-01',
          nationality: 'Spain',
          position: 'Midfielder',
          height_cm: 170,
          weight_kg: 65,
          profile_image_url: 'http://img.example/jane.png',
        }),
      });
      expect(showMessage).toHaveBeenCalledWith('Player created successfully', 'success');
      expect(setPlayers).toHaveBeenCalledWith([bob]);
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenLastCalledWith(false);
      // handleCancelEditPlayer runs after a successful submit.
      expect(result.current.playerForm).toEqual(emptyPlayerFormShape);
    });

    it('updates a player via PUT, including its id, when in edit mode', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(fetchOk({ data: { id: 'player-1' } })) // PUT
        .mockResolvedValueOnce(fetchOk({ data: [alice] })); // reload GET
      const { result, showMessage } = setup();

      await act(async () => {
        await result.current.handleEditPlayer(alice);
      });
      await act(async () => {
        await result.current.handlePlayerSubmit(fakeEvent);
      });

      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        '/api/admin/players',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"id":"player-1"'),
        })
      );
      expect(showMessage).toHaveBeenCalledWith('Player updated successfully', 'success');
    });

    it('falls back to null for blank fields', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(fetchOk({ data: {} }))
        .mockResolvedValueOnce(fetchOk({}));
      const { result } = setup();

      act(() =>
        result.current.setPlayerForm({
          first_name: '',
          last_name: 'Doe',
          date_of_birth: '',
          nationality: '',
          position: '',
          height_cm: 0,
          weight_kg: 0,
          profile_image_url: '',
        })
      );

      await act(async () => {
        await result.current.handlePlayerSubmit(fakeEvent);
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body).toEqual({
        first_name: null,
        last_name: 'Doe',
        date_of_birth: null,
        nationality: null,
        position: null,
        height_cm: null,
        weight_kg: null,
        profile_image_url: null,
      });
    });

    it('does not call setPlayers when the reload response has no data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(fetchOk({ data: {} })).mockResolvedValueOnce(fetchOk({}));
      const { result, setPlayers } = setup();

      act(() => result.current.setPlayerForm({ ...emptyPlayerFormShape, last_name: 'Doe' }));
      await act(async () => {
        await result.current.handlePlayerSubmit(fakeEvent);
      });

      expect(setPlayers).not.toHaveBeenCalled();
    });

    it('still shows the success message when the reload fetch itself fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(fetchOk({ data: {} }))
        .mockRejectedValueOnce(new Error('reload failed'));
      const { result, setPlayers, showMessage } = setup();

      act(() => result.current.setPlayerForm({ ...emptyPlayerFormShape, last_name: 'Doe' }));
      await act(async () => {
        await result.current.handlePlayerSubmit(fakeEvent);
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(showMessage).toHaveBeenCalledWith('Player created successfully', 'success');
      expect(setPlayers).not.toHaveBeenCalled();
    });

    it('uses the default failure message when the response is not ok and has no error field', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(fetchErr({}));
      const { result, showMessage, setLoading } = setup();

      act(() => result.current.setPlayerForm({ ...emptyPlayerFormShape, last_name: 'Doe' }));
      await act(async () => {
        await result.current.handlePlayerSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Error creating player: Failed to create player', 'error');
      expect(setLoading).toHaveBeenLastCalledWith(false);
    });

    it('uses the failure message when the response is not ok in edit mode', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
      (global.fetch as jest.Mock).mockResolvedValueOnce(fetchErr({}));
      const { result, showMessage } = setup();

      await act(async () => {
        await result.current.handleEditPlayer(alice);
      });
      await act(async () => {
        await result.current.handlePlayerSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Error updating player: Failed to update player', 'error');
    });

    it('uses the server-provided error text when the response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(fetchErr({ error: 'Name already exists' }));
      const { result, showMessage } = setup();

      act(() => result.current.setPlayerForm({ ...emptyPlayerFormShape, last_name: 'Doe' }));
      await act(async () => {
        await result.current.handlePlayerSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Error creating player: Name already exists', 'error');
    });

    it("uses the error's code when it has a code but no message", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject({ code: 'NETWORK_ERR' }));
      const { result, showMessage } = setup();

      act(() => result.current.setPlayerForm({ ...emptyPlayerFormShape, last_name: 'Doe' }));
      await act(async () => {
        await result.current.handlePlayerSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Error creating player: NETWORK_ERR', 'error');
    });

    it('JSON-stringifies the error when it has neither a message nor a code', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject({ foo: 'bar' }));
      const { result, showMessage } = setup();

      act(() => result.current.setPlayerForm({ ...emptyPlayerFormShape, last_name: 'Doe' }));
      await act(async () => {
        await result.current.handlePlayerSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Error creating player: {"foo":"bar"}', 'error');
    });

    it('uses the error text directly when a string is thrown', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject('boom'));
      const { result, showMessage } = setup();

      act(() => result.current.setPlayerForm({ ...emptyPlayerFormShape, last_name: 'Doe' }));
      await act(async () => {
        await result.current.handlePlayerSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Error creating player: boom', 'error');
    });

    it('falls back to the bare default message for non-object, non-string errors', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject(42));
      const { result, showMessage } = setup();

      act(() => result.current.setPlayerForm({ ...emptyPlayerFormShape, last_name: 'Doe' }));
      await act(async () => {
        await result.current.handlePlayerSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Error creating player', 'error');
    });
  });

  describe('player history modal', () => {
    it('resets the form to the exact expected shape on close', () => {
      const { result } = setup();

      act(() => result.current.openEditPlayerHistory(history));
      act(() => result.current.closePlayerHistoryModal());

      expect(result.current.showPlayerHistoryModal).toBe(false);
      expect(result.current.editingPlayerHistoryId).toBeNull();
      expect(result.current.playerHistoryFormError).toBeNull();
      expect(result.current.playerHistoryForm).toEqual({
        player_id: '',
        team_id: 1,
        joined_on: '',
        left_on: '',
        squad_number: null,
      });
    });

    it('opens a new-history form pre-filled with the currently editing player id', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditPlayer(alice);
      });
      act(() => result.current.openNewPlayerHistory());

      expect(result.current.showPlayerHistoryModal).toBe(true);
      expect(result.current.editingPlayerHistoryId).toBeNull();
      expect(result.current.playerHistoryForm).toEqual({
        player_id: 'player-1',
        team_id: 1,
        joined_on: '',
        left_on: '',
        squad_number: null,
      });
    });

    it('opens pre-filled with the exact selected history record', () => {
      const { result } = setup();

      act(() => result.current.openEditPlayerHistory(history));

      expect(result.current.showPlayerHistoryModal).toBe(true);
      expect(result.current.editingPlayerHistoryId).toBe('history-1');
      expect(result.current.playerHistoryFormError).toBeNull();
      expect(result.current.playerHistoryForm).toEqual({
        player_id: 'player-1',
        team_id: 1,
        joined_on: '2023-01-01',
        left_on: null,
        squad_number: 9,
      });
    });

    it('requires a joined_on date before submitting', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.handlePlayerHistorySubmit();
      });

      expect(result.current.playerHistoryFormError).toBe('Joined On is required');
      expect(mockCallAdminApi).not.toHaveBeenCalled();
    });

    it('creates a new history record with the exact endpoint, payload, and left_on fallback', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: [] }) // player-stats (handleEditPlayer)
        .mockResolvedValueOnce({ data: [] }) // player-history (handleEditPlayer)
        .mockResolvedValueOnce({ data: { id: 'history-2' } }) // POST
        .mockResolvedValueOnce({ data: [history] }); // reload GET
      const { result, showMessage } = setup();

      await act(async () => {
        await result.current.handleEditPlayer(alice);
      });
      act(() => result.current.openNewPlayerHistory());
      act(() =>
        result.current.setPlayerHistoryForm({
          ...result.current.playerHistoryForm,
          joined_on: '2024-01-01',
          left_on: '',
        })
      );

      await act(async () => {
        await result.current.handlePlayerHistorySubmit();
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(3, 'player-history', 'POST', {
        player_id: 'player-1',
        team_id: 1,
        joined_on: '2024-01-01',
        left_on: null,
        squad_number: null,
      });
      expect(mockCallAdminApi).toHaveBeenNthCalledWith(4, 'player-history', 'GET');
      expect(showMessage).toHaveBeenCalledWith('Player history created successfully', 'success');
      expect(result.current.showPlayerHistoryModal).toBe(false);
    });

    it('keeps a truthy left_on value instead of nulling it', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: { id: 'history-2' } }).mockResolvedValueOnce({ data: [] });
      const { result } = setup();

      act(() => result.current.openNewPlayerHistory());
      act(() =>
        result.current.setPlayerHistoryForm({
          ...result.current.playerHistoryForm,
          joined_on: '2024-01-01',
          left_on: '2024-06-01',
        })
      );

      await act(async () => {
        await result.current.handlePlayerHistorySubmit();
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(
        1,
        'player-history',
        'POST',
        expect.objectContaining({ left_on: '2024-06-01' })
      );
    });

    it('updates an existing history record via PUT with its id', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: { id: 'history-1' } }).mockResolvedValueOnce({ data: [] });
      const { result, showMessage } = setup();

      act(() => result.current.openEditPlayerHistory(history));

      await act(async () => {
        await result.current.handlePlayerHistorySubmit();
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'player-history', 'PUT', {
        id: 'history-1',
        player_id: 'player-1',
        team_id: 1,
        joined_on: '2023-01-01',
        left_on: null,
        squad_number: 9,
      });
      expect(showMessage).toHaveBeenCalledWith('Player history updated successfully', 'success');
    });

    it('sets a form error and keeps the modal open when the API returns an error, without showing a message', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ error: 'Squad number already taken' });
      const { result, showMessage } = setup();

      act(() => result.current.openNewPlayerHistory());
      act(() => result.current.setPlayerHistoryForm({ ...result.current.playerHistoryForm, joined_on: '2024-01-01' }));

      await act(async () => {
        await result.current.handlePlayerHistorySubmit();
      });

      expect(result.current.playerHistoryFormError).toBe('Squad number already taken');
      expect(result.current.showPlayerHistoryModal).toBe(true);
      expect(showMessage).not.toHaveBeenCalled();
      expect(mockCallAdminApi).toHaveBeenCalledTimes(1);
    });

    it('reloads related history filtered to the currently editing player only', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: [] }) // player-stats (handleEditPlayer)
        .mockResolvedValueOnce({ data: [] }) // player-history (handleEditPlayer)
        .mockResolvedValueOnce({ data: { id: 'history-3' } }) // POST
        .mockResolvedValueOnce({ data: [history, historyOther] }); // reload GET
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditPlayer(alice);
      });
      act(() => result.current.openNewPlayerHistory());
      act(() => result.current.setPlayerHistoryForm({ ...result.current.playerHistoryForm, joined_on: '2024-01-01' }));

      await act(async () => {
        await result.current.handlePlayerHistorySubmit();
      });

      expect(result.current.relatedPlayerHistory).toEqual([history]);
    });

    it('sets a distinct error message and stops loading when the create call throws', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('boom'));
      const { result, setLoading } = setup();

      act(() => result.current.openNewPlayerHistory());
      act(() => result.current.setPlayerHistoryForm({ ...result.current.playerHistoryForm, joined_on: '2024-01-01' }));

      await act(async () => {
        await result.current.handlePlayerHistorySubmit();
      });

      expect(result.current.playerHistoryFormError).toBe('Error creating player history');
      expect(setLoading).toHaveBeenLastCalledWith(false);
    });

    it('sets a distinct error message when the update call throws', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('boom'));
      const { result } = setup();

      act(() => result.current.openEditPlayerHistory(history));

      await act(async () => {
        await result.current.handlePlayerHistorySubmit();
      });

      expect(result.current.playerHistoryFormError).toBe('Error updating player history');
    });
  });

  describe('handleDeletePlayerHistory', () => {
    it('deletes a history record with the exact endpoint and payload, then reloads', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({ data: [history, historyOther] }); // reload GET
      const { result, showMessage, setLoading } = setup();

      await act(async () => {
        await result.current.handleDeletePlayerHistory('history-1');
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'player-history', 'DELETE', { id: 'history-1' });
      expect(mockCallAdminApi).toHaveBeenNthCalledWith(2, 'player-history', 'GET');
      expect(showMessage).toHaveBeenCalledWith('Player history deleted successfully', 'success');
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenLastCalledWith(false);
    });

    it('filters the reloaded history down to the currently editing player', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: [] }) // player-stats (handleEditPlayer)
        .mockResolvedValueOnce({ data: [] }) // player-history (handleEditPlayer)
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({ data: [history, historyOther] }); // reload GET
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditPlayer(alice);
      });

      await act(async () => {
        await result.current.handleDeletePlayerHistory('history-1');
      });

      expect(result.current.relatedPlayerHistory).toEqual([history]);
    });

    it('does not overwrite related history when the reload response has no data', async () => {
      mockCallAdminApi.mockResolvedValueOnce({}).mockResolvedValueOnce({});
      const { result } = setup();

      await act(async () => {
        await result.current.handleDeletePlayerHistory('history-1');
      });

      expect(result.current.relatedPlayerHistory).toEqual([]);
    });

    it('shows a success message even when the reload fetch fails', async () => {
      mockCallAdminApi.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('reload failed'));
      const { result, showMessage } = setup();

      await act(async () => {
        await result.current.handleDeletePlayerHistory('history-1');
      });

      expect(showMessage).toHaveBeenCalledWith('Player history deleted successfully', 'success');
    });

    it('shows an error message and stops loading when the delete call fails', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('boom'));
      const { result, showMessage, setLoading } = setup();

      await act(async () => {
        await result.current.handleDeletePlayerHistory('history-1');
      });

      expect(showMessage).toHaveBeenCalledWith('Error deleting player history', 'error');
      expect(setLoading).toHaveBeenLastCalledWith(false);
    });
  });

  it('resetTabState exits edit mode, hides the form, and resets pagination to page 1', () => {
    const { result } = setup();

    act(() => result.current.setShowPlayerForm(true));
    act(() => result.current.setCurrentPage(3));

    act(() => result.current.resetTabState());

    expect(result.current.isPlayerEditMode).toBe(false);
    expect(result.current.editingPlayerId).toBeNull();
    expect(result.current.showPlayerForm).toBe(false);
    expect(result.current.currentPage).toBe(1);
  });
});
