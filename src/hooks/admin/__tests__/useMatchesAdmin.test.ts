import { renderHook, act } from '@testing-library/react';
import { useMatchesAdmin } from '../useMatchesAdmin';
import { callAdminApi } from '@/lib/api-client';
import type { Match, Team, Stadium, StadiumName, Media } from '@/types/spurs-women-admin';

jest.mock('@/lib/api-client', () => ({
  callAdminApi: jest.fn(),
}));

const mockCallAdminApi = callAdminApi as jest.Mock;

const spurs: Team = { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', is_tottenham: true, primary_color: null, secondary_color: null };
const arsenal: Team = { id: 2, name: 'Arsenal', short_name: 'ARS', is_tottenham: false, primary_color: null, secondary_color: null };

const stadium: Stadium = {
  id: 'stadium-1',
  name: 'Tottenham Hotspur Stadium',
  slug: 'tottenham-hotspur-stadium',
  city: 'London',
  country: 'England',
  capacity: null,
  opened_date: null,
  address_line_1: null,
  postcode: null,
  latitude: null,
  longitude: null,
  home_team_id: 1,
};

const match: Match = {
  id: 'match-1',
  season_id: 'season-1',
  competition_id: 'comp-1',
  date: '2026-03-01',
  kickoff_time: '15:00',
  is_home_match: true,
  spurs_score: 2,
  opponent_score: 1,
  spurs_score_aet: null,
  opponent_score_aet: null,
  spurs_score_pens: null,
  opponent_score_pens: null,
  stadium_id: 'stadium-1',
  stadium_display_name: 'Tottenham Hotspur Stadium',
  attended: false,
  notes: null,
  home_team_id: 1,
  away_team_id: 2,
  attendance: null,
  home_possession: null,
  away_possession: null,
  home_total_shots: null,
  away_total_shots: null,
  home_shots_on_target: null,
  away_shots_on_target: null,
  home_corners: null,
  away_corners: null,
};

function setup(matches: Match[] = [match]) {
  const setMatches = jest.fn();
  const setLoading = jest.fn();
  const showMessage = jest.fn();
  const { result } = renderHook(() =>
    useMatchesAdmin({
      matches,
      setMatches,
      teams: [spurs, arsenal],
      stadiums: [stadium],
      stadiumNames: [] as StadiumName[],
      setLoading,
      showMessage,
    })
  );
  return { result, setMatches, setLoading, showMessage };
}

describe('useMatchesAdmin', () => {
  beforeEach(() => {
    mockCallAdminApi.mockReset();
    mockCallAdminApi.mockResolvedValue({ data: [] });
    global.fetch = jest.fn();
    window.scrollTo = jest.fn();
  });

  it('populates the form and fetches related media/player-stats when editing', async () => {
    mockCallAdminApi
      .mockResolvedValueOnce({ data: [] }) // media
      .mockResolvedValueOnce({ data: [] }); // player-stats
    const { result } = setup();

    await act(async () => {
      await result.current.handleEditMatch(match);
    });

    expect(result.current.isEditMode).toBe(true);
    expect(result.current.matchForm.stadium_id).toBe('stadium-1');
  });

  it('resets edit mode on cancel', () => {
    const { result } = setup();

    act(() => result.current.setShowMatchForm(true));
    act(() => result.current.handleCancelEdit());

    expect(result.current.isEditMode).toBe(false);
    expect(result.current.showMatchForm).toBe(false);
  });

  it('deletes a match and reloads the list', async () => {
    mockCallAdminApi
      .mockResolvedValueOnce({}) // DELETE
      .mockResolvedValueOnce({ data: [] }); // reload GET
    const { result, setMatches, showMessage } = setup();

    await act(async () => {
      await result.current.handleDeleteMatch('match-1');
    });

    expect(showMessage).toHaveBeenCalledWith('Match deleted successfully', 'success');
    expect(setMatches).toHaveBeenCalledWith([]);
  });

  it('rejects submit when the Tottenham team is missing from the roster', async () => {
    const setMatches = jest.fn();
    const setLoading = jest.fn();
    const showMessage = jest.fn();
    const { result } = renderHook(() =>
      useMatchesAdmin({
        matches: [match],
        setMatches,
        teams: [arsenal], // no is_tottenham team present
        stadiums: [stadium],
        stadiumNames: [],
        setLoading,
        showMessage,
      })
    );

    await act(async () => {
      await result.current.handleMatchSubmit({ preventDefault: () => {} } as React.FormEvent);
    });

    expect(showMessage).toHaveBeenCalledWith('Tottenham team not found', 'error');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  describe('media modal', () => {
    it('opens pre-filled for a new record of the given type', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditMatch(match);
      });
      act(() => result.current.openNewMedia('photo'));

      expect(result.current.showMediaModal).toBe(true);
      expect(result.current.newMediaForm.type).toBe('photo');
    });

    it('opens pre-filled with the selected record', () => {
      const media: Media = { id: 'media-1', match_id: 'match-1', type: 'article', title: 'Report', url: 'https://x', caption: null, sort_order: 0 };
      const { result } = setup();

      act(() => result.current.openEditMedia(media));

      expect(result.current.editingMediaId).toBe('media-1');
      expect(result.current.newMediaForm.title).toBe('Report');
    });

    it('deletes a media record', async () => {
      mockCallAdminApi
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({ data: [] }); // reload GET
      const { result, showMessage } = setup();

      await act(async () => {
        await result.current.handleDeleteMedia('media-1');
      });

      expect(showMessage).toHaveBeenCalledWith('Media deleted successfully', 'success');
    });
  });

  it('groups related media by type', () => {
    const { result } = setup();

    const grouped = result.current.getMediaByType();

    expect(Object.keys(grouped)).toEqual(['photo', 'photo album', 'article', 'social media', 'video-external']);
  });

  it('filters and paginates the passed-in matches list', () => {
    const otherMatch: Match = { ...match, id: 'match-2', date: '2026-04-01', away_team_id: 1, home_team_id: 2 };
    const { result } = setup([match, otherMatch]);

    act(() => result.current.setSearch('2026-04-01'));

    expect(result.current.filteredCount).toBe(1);
    expect(result.current.paginatedItems).toEqual([otherMatch]);
  });
});
