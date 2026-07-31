import { renderHook, act } from '@testing-library/react';
import { usePlayerStatsModal } from '../usePlayerStatsModal';
import { callAdminApi } from '@/lib/api-client';
import type { PlayerStats } from '@/types/spurs-women-admin';

jest.mock('@/lib/api-client', () => ({
  callAdminApi: jest.fn(),
}));

const mockCallAdminApi = callAdminApi as jest.Mock;

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

function setup(overrides: Partial<{ editingMatchId: string | null; editingPlayerId: string | null }> = {}) {
  const setRelatedPlayerStats = jest.fn();
  const setRelatedPlayerStatsForPlayer = jest.fn();
  const setLoading = jest.fn();
  const showMessage = jest.fn();
  const { result } = renderHook(() =>
    usePlayerStatsModal({
      editingMatchId: overrides.editingMatchId ?? 'match-1',
      editingPlayerId: overrides.editingPlayerId ?? 'player-1',
      setRelatedPlayerStats,
      setRelatedPlayerStatsForPlayer,
      setLoading,
      showMessage,
    })
  );
  return { result, setRelatedPlayerStats, setRelatedPlayerStatsForPlayer, setLoading, showMessage };
}

describe('usePlayerStatsModal', () => {
  beforeEach(() => {
    mockCallAdminApi.mockReset();
  });

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

    expect(result.current.editingPlayerStatsId).toBe('stat-1');
    expect(result.current.newPlayerStatsForm.goals).toBe(1);
  });

  it('requires player and match before submitting', async () => {
    const { result } = setup();

    act(() => result.current.setNewPlayerStatsForm({ player_id: '', match_id: '' }));
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.playerStatsFormError).toBe('Player and Match are both required');
    expect(mockCallAdminApi).not.toHaveBeenCalled();
  });

  it('refreshes the match-scoped related list after a successful submit in match context', async () => {
    mockCallAdminApi
      .mockResolvedValueOnce({ data: { id: 'stat-2' } }) // POST
      .mockResolvedValueOnce({ data: [stat] }); // reload GET
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

  it('refreshes the player-scoped related list after a successful submit in player context', async () => {
    mockCallAdminApi
      .mockResolvedValueOnce({ data: { id: 'stat-2' } }) // POST
      .mockResolvedValueOnce({ data: [stat] }); // reload GET
    const { result, setRelatedPlayerStats, setRelatedPlayerStatsForPlayer } = setup();

    act(() => result.current.openNew('player'));
    act(() => result.current.setNewPlayerStatsForm({ ...result.current.newPlayerStatsForm, match_id: 'match-1' }));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(setRelatedPlayerStatsForPlayer).toHaveBeenCalledWith([stat]);
    expect(setRelatedPlayerStats).not.toHaveBeenCalled();
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
});
