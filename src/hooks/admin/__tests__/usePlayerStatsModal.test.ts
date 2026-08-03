import { renderHook, act } from '@testing-library/react';
import { usePlayerStatsModal } from '../usePlayerStatsModal';
import { callAdminApi } from '@/lib/api-client';
import type { PlayerStats } from '@/types/spurs-women-admin';

jest.mock('@/lib/api-client', () => ({
  callAdminApi: jest.fn(),
}));

const mockCallAdminApi = callAdminApi as jest.Mock;

// The exact shape the hook resets/initializes `newPlayerStatsForm` to. Kept as a
// standalone literal (not imported from the source) so it independently pins down
// every field/default rather than trivially mirroring whatever the source says.
const EXPECTED_EMPTY_FORM: Partial<PlayerStats> = {
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

const stat: PlayerStats = {
  id: 'stat-1',
  player_id: 'player-1',
  match_id: 'match-1',
  team_id: 1,
  started: true,
  captain: false,
  was_substitute: false,
  was_unused_substitute: false,
  minute_on: null,
  minute_off: null,
  minutes_played: 90,
  goals: 1,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
  clean_sheet: null,
  saves: null,
  shots: 3,
  shots_on_target: 2,
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

// A second, deliberately different record (different id/match_id/player_id) used
// wherever a test needs to prove a `.filter()` call actually excludes non-matching
// items rather than coincidentally passing everything through.
const otherStat: PlayerStats = {
  ...stat,
  id: 'stat-2',
  player_id: 'player-2',
  match_id: 'match-2',
};

function setup(overrides: Partial<{ editingMatchId: string | null; editingPlayerId: string | null }> = {}) {
  const setRelatedPlayerStats = jest.fn();
  const setRelatedPlayerStatsForPlayer = jest.fn();
  const setLoading = jest.fn();
  const showMessage = jest.fn();
  const { result } = renderHook(() =>
    usePlayerStatsModal({
      editingMatchId: 'editingMatchId' in overrides ? overrides.editingMatchId! : 'match-1',
      editingPlayerId: 'editingPlayerId' in overrides ? overrides.editingPlayerId! : 'player-1',
      setRelatedPlayerStats,
      setRelatedPlayerStatsForPlayer,
      setLoading,
      showMessage,
    })
  );
  return { result, setRelatedPlayerStats, setRelatedPlayerStatsForPlayer, setLoading, showMessage };
}

describe('usePlayerStatsModal', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockCallAdminApi.mockReset();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('initial / reset form state', () => {
    it('initializes newPlayerStatsForm to the exact expected empty shape', () => {
      const { result } = setup();

      expect(result.current.newPlayerStatsForm).toEqual(EXPECTED_EMPTY_FORM);
    });

    it('resets newPlayerStatsForm to the exact empty shape after closing', () => {
      const { result } = setup();

      act(() => result.current.openEdit(stat, 'match'));
      expect(result.current.newPlayerStatsForm).not.toEqual(EXPECTED_EMPTY_FORM);

      act(() => result.current.closeModal());

      expect(result.current.newPlayerStatsForm).toEqual(EXPECTED_EMPTY_FORM);
      expect(result.current.editingPlayerStatsId).toBeNull();
      expect(result.current.playerStatsFormError).toBeNull();
      expect(result.current.showPlayerStatsModal).toBe(false);
    });
  });

  describe('opening the modal', () => {
    it('opens a blank form scoped to the match when opened from the matches tab', () => {
      const { result } = setup();

      act(() => result.current.openNew('match'));

      expect(result.current.showPlayerStatsModal).toBe(true);
      expect(result.current.newPlayerStatsForm.match_id).toBe('match-1');
      expect(result.current.newPlayerStatsForm.player_id).toBe('');
    });

    it('opens a blank form scoped to the player when opened from the players tab', () => {
      const { result } = setup();

      act(() => result.current.openNew('player'));

      expect(result.current.newPlayerStatsForm.player_id).toBe('player-1');
      expect(result.current.newPlayerStatsForm.match_id).toBe('');
    });

    it('opens pre-filled with an existing record', () => {
      const { result } = setup();

      act(() => result.current.openEdit(stat, 'match'));

      expect(result.current.showPlayerStatsModal).toBe(true);
      expect(result.current.editingPlayerStatsId).toBe('stat-1');
      expect(result.current.newPlayerStatsForm.goals).toBe(1);
    });
  });

  describe('validation', () => {
    it('requires player and match before submitting', async () => {
      const { result, setLoading } = setup();

      act(() => result.current.setNewPlayerStatsForm({ player_id: '', match_id: '' }));
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.playerStatsFormError).toBe('Player and Match are both required');
      expect(mockCallAdminApi).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });

    it('errors when only the player is missing (match set)', async () => {
      const { result } = setup();

      act(() => result.current.setNewPlayerStatsForm({ player_id: '', match_id: 'match-1' }));
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.playerStatsFormError).toBe('Player and Match are both required');
      expect(mockCallAdminApi).not.toHaveBeenCalled();
    });

    it('errors when only the match is missing (player set)', async () => {
      const { result } = setup();

      act(() => result.current.setNewPlayerStatsForm({ player_id: 'player-1', match_id: '' }));
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.playerStatsFormError).toBe('Player and Match are both required');
      expect(mockCallAdminApi).not.toHaveBeenCalled();
    });
  });

  describe('was_substitute / was_unused_substitute derivation', () => {
    // Full truth table over (started, minute_on !== null) pins down the AND/OR/negation
    // logic for both derived fields at once.
    it.each([
      { started: false, minute_on: null, expectedSub: false, expectedUnused: true, label: 'did not start, never came on -> unused substitute' },
      { started: false, minute_on: 45, expectedSub: true, expectedUnused: false, label: 'did not start, came on -> substitute' },
      { started: true, minute_on: null, expectedSub: false, expectedUnused: false, label: 'started, no minute_on -> neither' },
      { started: true, minute_on: 45, expectedSub: false, expectedUnused: false, label: 'started, has a minute_on -> neither (started takes precedence)' },
    ])('$label', async ({ started, minute_on, expectedSub, expectedUnused }) => {
      mockCallAdminApi.mockResolvedValueOnce({ data: { id: 'new-id' } }).mockResolvedValueOnce({ data: [] });
      const { result } = setup();

      act(() => result.current.openNew('match'));
      act(() =>
        result.current.setNewPlayerStatsForm({
          ...result.current.newPlayerStatsForm,
          player_id: 'player-1',
          started,
          minute_on,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      const [, , body] = mockCallAdminApi.mock.calls[0];
      expect(body.was_substitute).toBe(expectedSub);
      expect(body.was_unused_substitute).toBe(expectedUnused);
    });
  });

  describe('handleSubmit - create (POST)', () => {
    it('calls the player-stats POST endpoint with the full payload', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: { id: 'stat-2' } }).mockResolvedValueOnce({ data: [] });
      const { result } = setup();

      act(() => result.current.openNew('match'));
      act(() => result.current.setNewPlayerStatsForm({ ...result.current.newPlayerStatsForm, player_id: 'player-1' }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(
        1,
        'player-stats',
        'POST',
        expect.objectContaining({ player_id: 'player-1', match_id: 'match-1' })
      );
    });

    it('sets loading true then false around a successful submit', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: { id: 'stat-2' } }).mockResolvedValueOnce({ data: [] });
      const { result, setLoading } = setup();

      act(() => result.current.openNew('match'));
      act(() => result.current.setNewPlayerStatsForm({ ...result.current.newPlayerStatsForm, player_id: 'player-1' }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(setLoading.mock.calls[0]).toEqual([true]);
      expect(setLoading.mock.calls[setLoading.mock.calls.length - 1]).toEqual([false]);
    });

    it('refreshes the match-scoped related list, filtering out stats from other matches, after a successful submit in match context', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: { id: 'stat-2' } }) // POST
        .mockResolvedValueOnce({ data: [stat, otherStat] }); // reload GET, two matches present
      const { result, setRelatedPlayerStats, setRelatedPlayerStatsForPlayer, showMessage } = setup();

      act(() => result.current.openNew('match'));
      act(() => result.current.setNewPlayerStatsForm({ ...result.current.newPlayerStatsForm, player_id: 'player-1' }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(showMessage).toHaveBeenCalledWith('Player stats created successfully', 'success');
      expect(setRelatedPlayerStats).toHaveBeenCalledWith([stat]);
      expect(setRelatedPlayerStatsForPlayer).not.toHaveBeenCalled();
      expect(result.current.showPlayerStatsModal).toBe(false);
    });

    it('refreshes the player-scoped related list, filtering out stats from other players, after a successful submit in player context', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: { id: 'stat-2' } }) // POST
        .mockResolvedValueOnce({ data: [stat, otherStat] }); // reload GET, two players present
      const { result, setRelatedPlayerStats, setRelatedPlayerStatsForPlayer } = setup();

      act(() => result.current.openNew('player'));
      act(() => result.current.setNewPlayerStatsForm({ ...result.current.newPlayerStatsForm, match_id: 'match-1' }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(setRelatedPlayerStatsForPlayer).toHaveBeenCalledWith([stat]);
      expect(setRelatedPlayerStats).not.toHaveBeenCalled();
    });

    it('does not refresh either related list when context is "player" but there is no editingPlayerId', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: { id: 'stat-2' } }) // PUT
        .mockResolvedValueOnce({ data: [stat, otherStat] }); // reload GET
      const { result, setRelatedPlayerStats, setRelatedPlayerStatsForPlayer } = setup({ editingPlayerId: null });

      // openEdit sets full valid player_id/match_id from `stat` directly, bypassing
      // the editingPlayerId!-based auto-fill that openNew('player') would otherwise
      // block on when editingPlayerId is null.
      act(() => result.current.openEdit(stat, 'player'));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(setRelatedPlayerStats).not.toHaveBeenCalled();
      expect(setRelatedPlayerStatsForPlayer).not.toHaveBeenCalled();
    });

    it('does not refresh either related list when context is "match" but there is no editingMatchId', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: { id: 'stat-2' } }) // PUT
        .mockResolvedValueOnce({ data: [stat, otherStat] }); // reload GET
      const { result, setRelatedPlayerStats, setRelatedPlayerStatsForPlayer } = setup({ editingMatchId: null });

      act(() => result.current.openEdit(stat, 'match'));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(setRelatedPlayerStats).not.toHaveBeenCalled();
      expect(setRelatedPlayerStatsForPlayer).not.toHaveBeenCalled();
    });

    it('does not update either related list when the reload GET response has no data', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: { id: 'stat-2' } }) // POST
        .mockResolvedValueOnce({}); // reload GET returns no `data`
      const { result, setRelatedPlayerStats, setRelatedPlayerStatsForPlayer } = setup();

      act(() => result.current.openNew('match'));
      act(() => result.current.setNewPlayerStatsForm({ ...result.current.newPlayerStatsForm, player_id: 'player-1' }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(setRelatedPlayerStats).not.toHaveBeenCalled();
      expect(setRelatedPlayerStatsForPlayer).not.toHaveBeenCalled();
    });

    it('sets the form error and does not close the modal or refresh when the API returns an error', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ error: 'Duplicate player stats record' });
      const { result, setRelatedPlayerStats, showMessage } = setup();

      act(() => result.current.openNew('match'));
      act(() => result.current.setNewPlayerStatsForm({ ...result.current.newPlayerStatsForm, player_id: 'player-1' }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.playerStatsFormError).toBe('Duplicate player stats record');
      expect(result.current.showPlayerStatsModal).toBe(true);
      expect(setRelatedPlayerStats).not.toHaveBeenCalled();
      expect(showMessage).not.toHaveBeenCalled();
      // Only the POST call should have happened - refreshRelatedStats must not run.
      expect(mockCallAdminApi).toHaveBeenCalledTimes(1);
    });

    it('sets a create-specific error message and still clears loading when the API call throws', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('network down'));
      const { result, setLoading } = setup();

      act(() => result.current.openNew('match'));
      act(() => result.current.setNewPlayerStatsForm({ ...result.current.newPlayerStatsForm, player_id: 'player-1' }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.playerStatsFormError).toBe('Error creating player stats');
      expect(result.current.showPlayerStatsModal).toBe(true);
      expect(setLoading.mock.calls[setLoading.mock.calls.length - 1]).toEqual([false]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('handleSubmit - update (PUT)', () => {
    it('calls the player-stats PUT endpoint with the id merged into the payload and shows the update message', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({ data: { id: 'stat-1' } }) // PUT
        .mockResolvedValueOnce({ data: [stat] }); // reload GET
      const { result, showMessage } = setup();

      act(() => result.current.openEdit(stat, 'match'));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(
        1,
        'player-stats',
        'PUT',
        expect.objectContaining({ id: 'stat-1', player_id: 'player-1', match_id: 'match-1' })
      );
      expect(showMessage).toHaveBeenCalledWith('Player stats updated successfully', 'success');
    });

    it('sets an update-specific error message when the API call throws', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('network down'));
      const { result } = setup();

      act(() => result.current.openEdit(stat, 'match'));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.playerStatsFormError).toBe('Error updating player stats');
    });
  });

  describe('handleDelete', () => {
    it('calls the player-stats DELETE endpoint with exactly the given id', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({ data: [] }); // reload GET
      const { result } = setup();

      act(() => result.current.openEdit(stat, 'match'));
      await act(async () => {
        await result.current.handleDelete('stat-1');
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'player-stats', 'DELETE', { id: 'stat-1' });
    });

    it('sets loading true then false around a successful delete', async () => {
      mockCallAdminApi.mockResolvedValueOnce({}).mockResolvedValueOnce({ data: [] });
      const { result, setLoading } = setup();

      act(() => result.current.openEdit(stat, 'match'));
      await act(async () => {
        await result.current.handleDelete('stat-1');
      });

      expect(setLoading.mock.calls[0]).toEqual([true]);
      expect(setLoading.mock.calls[setLoading.mock.calls.length - 1]).toEqual([false]);
    });

    it('deletes a record and shows a success message', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({ data: [] }); // reload GET
      const { result, showMessage } = setup();

      act(() => result.current.openEdit(stat, 'match'));
      await act(async () => {
        await result.current.handleDelete('stat-1');
      });

      expect(showMessage).toHaveBeenCalledWith('Player stats deleted successfully', 'success');
    });

    it('refreshes the match-scoped related list, excluding stats from other matches, after delete', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({ data: [stat, otherStat] }); // reload GET
      const { result, setRelatedPlayerStats } = setup();

      act(() => result.current.openEdit(stat, 'match'));
      await act(async () => {
        await result.current.handleDelete('stat-1');
      });

      expect(setRelatedPlayerStats).toHaveBeenCalledWith([stat]);
    });

    it('still shows success and clears loading when the record deletes but the reload fetch fails', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE succeeds
        .mockRejectedValueOnce(new Error('reload failed')); // reload GET fails
      const { result, showMessage, setLoading } = setup();

      act(() => result.current.openEdit(stat, 'match'));
      await act(async () => {
        await result.current.handleDelete('stat-1');
      });

      // The reload attempt must actually have been made (DELETE + GET), proving the
      // inner try block around refreshRelatedStats() wasn't skipped entirely.
      expect(mockCallAdminApi).toHaveBeenCalledTimes(2);
      expect(showMessage).toHaveBeenCalledWith('Player stats deleted successfully', 'success');
      expect(setLoading.mock.calls[setLoading.mock.calls.length - 1]).toEqual([false]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('shows an error message and clears loading when the delete call itself throws', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('delete failed'));
      const { result, showMessage, setLoading } = setup();

      act(() => result.current.openEdit(stat, 'match'));
      await act(async () => {
        await result.current.handleDelete('stat-1');
      });

      expect(showMessage).toHaveBeenCalledWith('Error deleting player stats', 'error');
      expect(setLoading.mock.calls[setLoading.mock.calls.length - 1]).toEqual([false]);
      // Only the failed DELETE call - no reload should be attempted.
      expect(mockCallAdminApi).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
