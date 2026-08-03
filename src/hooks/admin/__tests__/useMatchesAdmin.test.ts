import { renderHook, act } from '@testing-library/react';
import { useMatchesAdmin } from '../useMatchesAdmin';
import { callAdminApi } from '@/lib/api-client';
import type { Match, Team, Stadium, StadiumName, Media, PlayerStats } from '@/types/spurs-women-admin';

jest.mock('@/lib/api-client', () => ({
  callAdminApi: jest.fn(),
}));

const mockCallAdminApi = callAdminApi as jest.Mock;

const spurs: Team = { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', is_tottenham: true, primary_color: null, secondary_color: null };
const arsenal: Team = { id: 2, name: 'Arsenal', short_name: 'ARS', is_tottenham: false, primary_color: null, secondary_color: null };
const chelsea: Team = { id: 3, name: 'Chelsea', short_name: 'CHE', is_tottenham: false, primary_color: null, secondary_color: null };
const manCity: Team = { id: 4, name: 'Manchester City', short_name: 'MCI', is_tottenham: false, primary_color: null, secondary_color: null };

const stadiumA: Stadium = {
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

const stadiumB: Stadium = {
  id: 'stadium-2',
  name: 'Wembley Stadium',
  slug: 'wembley-stadium',
  city: 'London',
  country: 'England',
  capacity: null,
  opened_date: null,
  address_line_1: null,
  postcode: null,
  latitude: null,
  longitude: null,
  home_team_id: null,
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

const emptyMatchForm: Partial<Match> = {
  season_id: '',
  competition_id: '',
  date: '',
  kickoff_time: '',
  is_home_match: true,
  spurs_score: null,
  opponent_score: null,
  spurs_score_aet: null,
  opponent_score_aet: null,
  spurs_score_pens: null,
  opponent_score_pens: null,
  stadium_id: '',
  attended: false,
  notes: '',
  home_team_id: 1,
  away_team_id: 1,
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

const emptyMediaForm: Partial<Media> = {
  match_id: '',
  type: 'social media',
  title: '',
  url: '',
  caption: '',
  sort_order: 0,
};

function makeMedia(overrides: Partial<Media>): Media {
  return {
    id: 'media-x',
    match_id: 'match-1',
    type: 'photo',
    title: null,
    url: 'https://example.com',
    caption: null,
    sort_order: 0,
    ...overrides,
  };
}

function makeStat(overrides: Partial<PlayerStats>): PlayerStats {
  return {
    id: 'stat-x',
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
    ...overrides,
  };
}

function setup(options: {
  matches?: Match[];
  teams?: Team[];
  stadiums?: Stadium[];
  stadiumNames?: StadiumName[];
} = {}) {
  const setMatches = jest.fn();
  const setLoading = jest.fn();
  const showMessage = jest.fn();
  const { result } = renderHook(() =>
    useMatchesAdmin({
      matches: options.matches ?? [match],
      setMatches,
      teams: options.teams ?? [spurs, arsenal],
      stadiums: options.stadiums ?? [stadiumA],
      stadiumNames: options.stadiumNames ?? ([] as StadiumName[]),
      setLoading,
      showMessage,
    })
  );
  return { result, setMatches, setLoading, showMessage };
}

describe('useMatchesAdmin', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockCallAdminApi.mockReset();
    mockCallAdminApi.mockResolvedValue({ data: [] });
    global.fetch = jest.fn();
    window.scrollTo = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('initial state', () => {
    it('starts with the exact empty match form shape', () => {
      const { result } = setup();
      expect(result.current.matchForm).toEqual(emptyMatchForm);
    });

    it('starts with the exact empty media form shape', () => {
      const { result } = setup();
      expect(result.current.newMediaForm).toEqual(emptyMediaForm);
    });

    it('starts with all edit/modal state flags false and no selections', () => {
      const { result } = setup();
      expect(result.current.isEditMode).toBe(false);
      expect(result.current.editingMatchId).toBe(null);
      expect(result.current.showMatchForm).toBe(false);
      expect(result.current.showExtraTimeSection).toBe(false);
      expect(result.current.showStatsSection).toBe(false);
      expect(result.current.showMediaModal).toBe(false);
      expect(result.current.editingMediaId).toBe(null);
      expect(result.current.matchEditTab).toBe('details');
      expect(result.current.relatedMedia).toEqual([]);
      expect(result.current.relatedPlayerStats).toEqual([]);
      expect(result.current.perPage).toBe(20);
    });
  });

  describe('matchFilterFn (search)', () => {
    // Two matches with fully disjoint home/away teams, dates and stadium
    // display names (no shared substrings) so each field can be tested in
    // isolation, and getting any single field's lookup/comparison wrong
    // would pick up the wrong match (or none).
    const target: Match = {
      ...match,
      id: 'match-target',
      date: '2026-04-15',
      home_team_id: 1, // Spurs
      away_team_id: 2, // Arsenal
      stadium_display_name: 'North London Stadium',
    };
    const other: Match = {
      ...match,
      id: 'match-other',
      date: '2026-05-20',
      home_team_id: 3, // Chelsea
      away_team_id: 4, // Man City
      stadium_display_name: 'Etihad Campus',
    };

    function setupFilter() {
      return setup({ matches: [target, other], teams: [spurs, arsenal, chelsea, manCity] });
    }

    it('matches by date and excludes the other match', () => {
      const { result } = setupFilter();
      act(() => result.current.setSearch('2026-04-15'));
      expect(result.current.paginatedItems).toEqual([target]);
    });

    it('matches by home team short name', () => {
      const { result } = setupFilter();
      act(() => result.current.setSearch('spurs'));
      expect(result.current.paginatedItems).toEqual([target]);
    });

    it('matches by home team full name', () => {
      const { result } = setupFilter();
      act(() => result.current.setSearch('tottenham hotspur'));
      expect(result.current.paginatedItems).toEqual([target]);
    });

    it('matches by away team short name', () => {
      const { result } = setupFilter();
      act(() => result.current.setSearch('ars'));
      expect(result.current.paginatedItems).toEqual([target]);
    });

    it('matches by away team full name', () => {
      const { result } = setupFilter();
      act(() => result.current.setSearch('arsenal'));
      expect(result.current.paginatedItems).toEqual([target]);
    });

    it('matches by stadium display name', () => {
      const { result } = setupFilter();
      act(() => result.current.setSearch('north london'));
      expect(result.current.paginatedItems).toEqual([target]);
    });

    it("matches the other fixture's home team, disambiguating from the target", () => {
      const { result } = setupFilter();
      act(() => result.current.setSearch('chelsea'));
      expect(result.current.paginatedItems).toEqual([other]);
    });

    it("matches the other fixture's away team, disambiguating from the target", () => {
      const { result } = setupFilter();
      act(() => result.current.setSearch('manchester city'));
      expect(result.current.paginatedItems).toEqual([other]);
    });

    it("matches the other fixture's stadium display name", () => {
      const { result } = setupFilter();
      act(() => result.current.setSearch('etihad'));
      expect(result.current.paginatedItems).toEqual([other]);
    });

    it('is case-insensitive on the search term itself', () => {
      const { result } = setupFilter();
      act(() => result.current.setSearch('SPURS'));
      expect(result.current.paginatedItems).toEqual([target]);
    });

    it('returns no matches when nothing matches any field', () => {
      const { result } = setupFilter();
      act(() => result.current.setSearch('nonexistent-search-term'));
      expect(result.current.paginatedItems).toEqual([]);
      expect(result.current.filteredCount).toBe(0);
    });

    it('treats a missing home/away team as an empty name rather than throwing', () => {
      const orphan: Match = { ...match, id: 'orphan', home_team_id: 999, away_team_id: 998, date: '2026-06-01' };
      const { result } = setup({ matches: [orphan], teams: [spurs, arsenal] });
      expect(() => act(() => result.current.setSearch('anything'))).not.toThrow();
      act(() => result.current.setSearch('2026-06-01'));
      expect(result.current.paginatedItems).toEqual([orphan]);
    });

    it('does not throw when date or stadium_display_name is missing', () => {
      const noDate = { ...match, id: 'no-date', date: undefined, stadium_display_name: null } as unknown as Match;
      const { result } = setup({ matches: [noDate] });
      expect(() => act(() => result.current.setSearch('anything'))).not.toThrow();
    });
  });

  describe('getMediaByType', () => {
    it('groups related media into the correct type buckets and ignores unrecognised types', async () => {
      const photo = makeMedia({ id: 'm-photo', type: 'photo' });
      const article = makeMedia({ id: 'm-article', type: 'article' });
      const socialMedia = makeMedia({ id: 'm-social', type: 'social media' });
      const unknownType = makeMedia({ id: 'm-unknown', type: 'not-a-real-type' as unknown as Media['type'] });

      mockCallAdminApi
        .mockResolvedValueOnce({ data: [photo, article, socialMedia, unknownType] }) // media
        .mockResolvedValueOnce({ data: [] }); // player-stats
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditMatch(match);
      });

      const grouped = result.current.getMediaByType();
      expect(grouped).toEqual({
        photo: [photo],
        'photo album': [],
        article: [article],
        'social media': [socialMedia],
        'video-external': [],
      });
    });

    it('starts with all five type keys present and empty when there is no related media', () => {
      const { result } = setup();
      const grouped = result.current.getMediaByType();
      expect(grouped).toEqual({
        photo: [],
        'photo album': [],
        article: [],
        'social media': [],
        'video-external': [],
      });
    });
  });

  describe('handleCancelEdit', () => {
    it('resets all edit-mode state and the form back to the exact empty shape', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditMatch(match);
      });
      act(() => result.current.setShowExtraTimeSection(true));
      act(() => result.current.setShowStatsSection(true));

      act(() => result.current.handleCancelEdit());

      expect(result.current.isEditMode).toBe(false);
      expect(result.current.showMatchForm).toBe(false);
      expect(result.current.editingMatchId).toBe(null);
      expect(result.current.showExtraTimeSection).toBe(false);
      expect(result.current.showStatsSection).toBe(false);
      expect(result.current.matchForm).toEqual(emptyMatchForm);
    });
  });

  describe('handleEditMatch', () => {
    it('enters edit mode, sets the details tab, and scrolls to the exact position', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
      const { result } = setup();

      act(() => result.current.setMatchEditTab('related'));

      await act(async () => {
        await result.current.handleEditMatch(match);
      });

      expect(result.current.isEditMode).toBe(true);
      expect(result.current.showMatchForm).toBe(true);
      expect(result.current.editingMatchId).toBe('match-1');
      expect(result.current.matchEditTab).toBe('details');
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 250, left: 0, behavior: 'smooth' });
    });

    it('fetches related media and player-stats from the exact endpoints', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditMatch(match);
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'media', 'GET');
      expect(mockCallAdminApi).toHaveBeenNthCalledWith(2, 'player-stats', 'GET');
    });

    it('filters related media and player-stats down to just this match, from a mixed list', async () => {
      const forThisMatch = makeMedia({ id: 'media-1', match_id: 'match-1' });
      const forOtherMatch = makeMedia({ id: 'media-2', match_id: 'match-2' });
      const statForThisMatch = makeStat({ id: 'stat-1', match_id: 'match-1' });
      const statForOtherMatch = makeStat({ id: 'stat-2', match_id: 'match-2' });

      mockCallAdminApi
        .mockResolvedValueOnce({ data: [forThisMatch, forOtherMatch] })
        .mockResolvedValueOnce({ data: [statForThisMatch, statForOtherMatch] });
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditMatch(match);
      });

      expect(result.current.relatedMedia).toEqual([forThisMatch]);
      expect(result.current.relatedPlayerStats).toEqual([statForThisMatch]);
    });

    it('leaves related media/player-stats untouched when the responses have no data', async () => {
      mockCallAdminApi.mockResolvedValueOnce({}).mockResolvedValueOnce({});
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditMatch(match);
      });

      expect(result.current.relatedMedia).toEqual([]);
      expect(result.current.relatedPlayerStats).toEqual([]);
    });

    it('swallows errors from the related-records fetch and logs them', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('network down'));
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditMatch(match);
      });

      expect(result.current.isEditMode).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching related records:', expect.any(Error));
    });

    describe('stadium matching', () => {
      async function editWith(matchOverrides: Partial<Match>) {
        mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
        // stadiumB listed first so any predicate mutated to "always true" would
        // wrongly pick stadiumB instead of the intended stadiumA/none.
        const { result } = setup({ stadiums: [stadiumB, stadiumA] });
        await act(async () => {
          await result.current.handleEditMatch({ ...match, ...matchOverrides });
        });
        return result;
      }

      it('matches by stadium_id when it points at a known stadium', async () => {
        const result = await editWith({ stadium_id: 'stadium-2', stadium_display_name: 'Somewhere unrelated' });
        expect(result.current.matchForm.stadium_id).toBe('stadium-2');
      });

      it('matches by exact display-name equality when stadium_id is stale', async () => {
        const result = await editWith({ stadium_id: 'stale-id', stadium_display_name: 'Wembley Stadium' });
        expect(result.current.matchForm.stadium_id).toBe('stadium-2');
      });

      it('matches by case-insensitive display-name equality', async () => {
        const result = await editWith({ stadium_id: 'stale-id', stadium_display_name: 'WEMBLEY STADIUM' });
        expect(result.current.matchForm.stadium_id).toBe('stadium-2');
      });

      it('matches when the display name contains the current stadium name', async () => {
        const result = await editWith({ stadium_id: 'stale-id', stadium_display_name: 'Wembley Stadium (London)' });
        expect(result.current.matchForm.stadium_id).toBe('stadium-2');
      });

      it('matches when the current stadium name contains the display name', async () => {
        const result = await editWith({ stadium_id: 'stale-id', stadium_display_name: 'Wembley' });
        expect(result.current.matchForm.stadium_id).toBe('stadium-2');
      });

      it('falls back to the raw stadium_id when nothing matches', async () => {
        const result = await editWith({ stadium_id: 'totally-unknown-id', stadium_display_name: 'Nowhere Stadium' });
        expect(result.current.matchForm.stadium_id).toBe('totally-unknown-id');
      });

      it('falls back to an empty string when nothing matches and stadium_id is blank', async () => {
        const result = await editWith({ stadium_id: '', stadium_display_name: 'Nowhere Stadium' });
        expect(result.current.matchForm.stadium_id).toBe('');
      });

      it('falls back to the raw stadium_id (not the first stadium in the list) when stadium_display_name is null', async () => {
        // Regression test: a previous bug let a blank display name match the
        // FIRST stadium in array order via `currentNameLower.includes('')`
        // (every string includes the empty string). Fixed by skipping the
        // fuzzy-name checks entirely when stadium_display_name is falsy -
        // stadiumB is listed first specifically to catch a regression back
        // to that behaviour (it would wrongly return 'stadium-2' here).
        const result = await editWith({ stadium_id: 'stale-id', stadium_display_name: null });
        expect(result.current.matchForm.stadium_id).toBe('stale-id');
      });

      it('matches by stadium_id even when stadium_display_name is null', async () => {
        const result = await editWith({ stadium_id: 'stadium-2', stadium_display_name: null });
        expect(result.current.matchForm.stadium_id).toBe('stadium-2');
      });
    });

    describe('field fallbacks', () => {
      it('keeps kickoff_time and notes when present', async () => {
        mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
        const { result } = setup();
        await act(async () => {
          await result.current.handleEditMatch({ ...match, kickoff_time: '19:45', notes: 'Great atmosphere' });
        });
        expect(result.current.matchForm.kickoff_time).toBe('19:45');
        expect(result.current.matchForm.notes).toBe('Great atmosphere');
      });

      it('falls back kickoff_time and notes to empty string when null/missing', async () => {
        mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
        const { result } = setup();
        const blank = { ...match, kickoff_time: null, notes: null } as unknown as Match;
        await act(async () => {
          await result.current.handleEditMatch(blank);
        });
        expect(result.current.matchForm.kickoff_time).toBe('');
        expect(result.current.matchForm.notes).toBe('');
      });

      it('copies through every other match field unchanged', async () => {
        mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
        const { result } = setup();
        await act(async () => {
          await result.current.handleEditMatch(match);
        });
        expect(result.current.matchForm).toMatchObject({
          season_id: match.season_id,
          competition_id: match.competition_id,
          date: match.date,
          is_home_match: match.is_home_match,
          spurs_score: match.spurs_score,
          opponent_score: match.opponent_score,
          attended: match.attended,
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
        });
      });
    });
  });

  describe('handleDeleteMatch', () => {
    it('calls the exact delete endpoint with the match id', async () => {
      mockCallAdminApi.mockResolvedValueOnce({}).mockResolvedValueOnce({ data: [] });
      const { result } = setup();

      await act(async () => {
        await result.current.handleDeleteMatch('match-1');
      });

      expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'matches', 'DELETE', { id: 'match-1' });
    });

    it('sets loading true then false around the whole operation', async () => {
      mockCallAdminApi.mockResolvedValueOnce({}).mockResolvedValueOnce({ data: [] });
      const { result, setLoading } = setup();

      await act(async () => {
        await result.current.handleDeleteMatch('match-1');
      });

      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenLastCalledWith(false);
    });

    it('reloads the matches list from the exact endpoint on success', async () => {
      const reloaded = [{ ...match, id: 'match-reloaded' }];
      mockCallAdminApi.mockResolvedValueOnce({}).mockResolvedValueOnce({ data: reloaded });
      const { result, setMatches, showMessage } = setup();

      await act(async () => {
        await result.current.handleDeleteMatch('match-1');
      });

      expect(showMessage).toHaveBeenCalledWith('Match deleted successfully', 'success');
      expect(mockCallAdminApi).toHaveBeenNthCalledWith(2, 'matches', 'GET');
      expect(setMatches).toHaveBeenCalledWith(reloaded);
    });

    it('does not update matches when the reload response has no data', async () => {
      mockCallAdminApi.mockResolvedValueOnce({}).mockResolvedValueOnce({});
      const { result, setMatches } = setup();

      await act(async () => {
        await result.current.handleDeleteMatch('match-1');
      });

      expect(setMatches).not.toHaveBeenCalled();
    });

    it('swallows a reload failure without failing the whole operation', async () => {
      mockCallAdminApi.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('reload failed'));
      const { result, showMessage, setLoading } = setup();

      await act(async () => {
        await result.current.handleDeleteMatch('match-1');
      });

      expect(showMessage).toHaveBeenCalledWith('Match deleted successfully', 'success');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error reloading matches:', expect.any(Error));
      expect(setLoading).toHaveBeenLastCalledWith(false);
    });

    it('shows an error message and still clears loading when the delete call itself fails', async () => {
      mockCallAdminApi.mockRejectedValueOnce(new Error('delete failed'));
      const { result, showMessage, setLoading, setMatches } = setup();

      await act(async () => {
        await result.current.handleDeleteMatch('match-1');
      });

      expect(showMessage).toHaveBeenCalledWith('Error deleting match', 'error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting match:', expect.any(Error));
      expect(setLoading).toHaveBeenLastCalledWith(false);
      expect(setMatches).not.toHaveBeenCalled();
    });
  });

  describe('handleMatchSubmit', () => {
    const validForm: Partial<Match> = {
      season_id: 'season-1',
      competition_id: 'comp-1',
      date: '2026-03-01',
      is_home_match: true,
      away_team_id: 2,
    };
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;

    function okResponse(body: unknown = { data: {} }) {
      return { ok: true, json: async () => body };
    }

    it('rejects submit when the Tottenham team is missing from the roster', async () => {
      const { result, showMessage } = setup({ teams: [arsenal] });

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Tottenham team not found', 'error');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it.each([
      ['season_id', { ...validForm, season_id: '' }],
      ['competition_id', { ...validForm, competition_id: '' }],
      ['date', { ...validForm, date: '' }],
      ['away_team_id', { ...validForm, away_team_id: undefined }],
    ])('rejects submit when %s is missing', async (_field, formOverride) => {
      const { result, showMessage } = setup();
      act(() => result.current.setMatchForm(formOverride as Partial<Match>));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Please fill in all required fields', 'error');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('proceeds to submit when every required field is present', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(okResponse());
      const { result, showMessage } = setup();
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(global.fetch).toHaveBeenCalled();
      expect(showMessage).not.toHaveBeenCalledWith('Please fill in all required fields', 'error');
    });

    it('POSTs to the exact endpoint with the exact headers/body when creating', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(okResponse());
      const { result } = setup();
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season_id: 'season-1',
          competition_id: 'comp-1',
          date: '2026-03-01',
          kickoff_time: null,
          is_home_match: true,
          spurs_score: null,
          opponent_score: null,
          spurs_score_aet: null,
          opponent_score_aet: null,
          spurs_score_pens: null,
          opponent_score_pens: null,
          attendance: null,
          home_possession: null,
          away_possession: null,
          home_total_shots: null,
          away_total_shots: null,
          home_shots_on_target: null,
          away_shots_on_target: null,
          home_corners: null,
          away_corners: null,
          stadium_id: '',
          attended: false,
          notes: '',
          home_team_id: 1,
          away_team_id: 2,
        }),
      });
    });

    it('PUTs with the editing id merged into the body when in edit mode', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(okResponse()) // PUT
        .mockResolvedValueOnce(okResponse({ data: [] })); // reload GET
      const { result } = setup();

      await act(async () => {
        await result.current.handleEditMatch(match);
      });
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
      expect(requestInit.method).toBe('PUT');
      const body = JSON.parse(requestInit.body);
      expect(body.id).toBe('match-1');
    });

    it('shows the create-mode success message and resets the form on success', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(okResponse())
        .mockResolvedValueOnce(okResponse({ data: [] }));
      const { result, showMessage } = setup();
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Match created successfully', 'success');
      expect(result.current.matchForm).toEqual(emptyMatchForm);
      expect(result.current.showMatchForm).toBe(false);
    });

    it('shows the update-mode success message when in edit mode', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(okResponse())
        .mockResolvedValueOnce(okResponse({ data: [] }));
      const { result, showMessage } = setup();

      await act(async () => {
        await result.current.handleEditMatch(match);
      });
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Match updated successfully', 'success');
    });

    it('reloads matches from the exact GET endpoint and applies the returned data', async () => {
      const reloaded = [{ ...match, id: 'reloaded-1' }];
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(okResponse())
        .mockResolvedValueOnce(okResponse({ data: reloaded }));
      const { result, setMatches } = setup();
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/admin/matches');
      expect(setMatches).toHaveBeenCalledWith(reloaded);
    });

    it('does not update matches when the reload has no data', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(okResponse())
        .mockResolvedValueOnce(okResponse({}));
      const { result, setMatches } = setup();
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(setMatches).not.toHaveBeenCalled();
    });

    it('swallows a reload failure after a successful save', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(okResponse())
        .mockRejectedValueOnce(new Error('reload boom'));
      const { result, showMessage } = setup();
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Match created successfully', 'success');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error reloading matches:', expect.any(Error));
    });

    it('uses the response error and create-mode prefix when the response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Server exploded' }) });
      const { result, showMessage } = setup();
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Error creating match: Server exploded', 'error');
    });

    it('uses the update-mode prefix in the fallback message when not ok, no error field, in edit mode', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({}) });
      const { result, showMessage } = setup();

      await act(async () => {
        await result.current.handleEditMatch(match);
      });
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Error updating match: Failed to update match', 'error');
    });

    it('builds the error message from error.message when the thrown value is an Error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));
      const { result, showMessage } = setup();
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Error creating match: Network failure', 'error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating match:', expect.any(Error));
    });

    it('builds the error message from error.code when the thrown value has a code but no message', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce({ code: 'ECONNRESET' });
      const { result, showMessage } = setup();
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Error creating match: ECONNRESET', 'error');
    });

    it('stringifies the thrown value when it is a plain object without message/code', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce({ foo: 'bar' });
      const { result, showMessage } = setup();
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith(`Error creating match: ${JSON.stringify({ foo: 'bar' })}`, 'error');
    });

    it('appends the raw string when the thrown value is a string', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('boom');
      const { result, showMessage } = setup();
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(showMessage).toHaveBeenCalledWith('Error creating match: boom', 'error');
    });

    it('sets loading true then false around the whole submit, even on failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('boom'));
      const { result, setLoading } = setup();
      act(() => result.current.setMatchForm(validForm));

      await act(async () => {
        await result.current.handleMatchSubmit(fakeEvent);
      });

      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenLastCalledWith(false);
    });
  });

  describe('media modal', () => {
    describe('closeMediaModal', () => {
      it('closes the modal, clears the editing id, and resets the form to the exact empty shape', () => {
        const { result } = setup();
        act(() => result.current.openEditMedia(makeMedia({ id: 'media-1', title: 'Report' })));

        act(() => result.current.closeMediaModal());

        expect(result.current.showMediaModal).toBe(false);
        expect(result.current.editingMediaId).toBe(null);
        expect(result.current.newMediaForm).toEqual(emptyMediaForm);
      });
    });

    describe('openNewMedia', () => {
      it('opens with an exact blank form scoped to the editing match and requested type', async () => {
        mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
        const { result } = setup();
        await act(async () => {
          await result.current.handleEditMatch(match);
        });

        act(() => result.current.openNewMedia('article'));

        expect(result.current.showMediaModal).toBe(true);
        expect(result.current.newMediaForm).toEqual({
          match_id: 'match-1',
          type: 'article',
          title: '',
          url: '',
          caption: '',
          sort_order: 0,
        });
      });
    });

    describe('openEditMedia', () => {
      it('copies present fields through unchanged', () => {
        const { result } = setup();
        const media = makeMedia({ id: 'media-1', title: 'Report', url: 'https://x', caption: 'A caption', sort_order: 3 });

        act(() => result.current.openEditMedia(media));

        expect(result.current.editingMediaId).toBe('media-1');
        expect(result.current.showMediaModal).toBe(true);
        expect(result.current.newMediaForm).toEqual({
          match_id: media.match_id,
          type: media.type,
          title: 'Report',
          url: 'https://x',
          caption: 'A caption',
          sort_order: 3,
        });
      });

      it('falls back title/url/caption to empty string and sort_order to 0 when null/falsy', () => {
        const { result } = setup();
        const media = makeMedia({ id: 'media-2', title: null, url: '', caption: null, sort_order: 0 });

        act(() => result.current.openEditMedia(media));

        expect(result.current.newMediaForm.title).toBe('');
        expect(result.current.newMediaForm.url).toBe('');
        expect(result.current.newMediaForm.caption).toBe('');
        expect(result.current.newMediaForm.sort_order).toBe(0);
      });
    });

    describe('handleDeleteMedia', () => {
      it('calls the exact delete endpoint with the media id', async () => {
        mockCallAdminApi.mockResolvedValueOnce({}).mockResolvedValueOnce({ data: [] });
        const { result } = setup();

        await act(async () => {
          await result.current.handleDeleteMedia('media-1');
        });

        expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'media', 'DELETE', { id: 'media-1' });
      });

      it('reloads related media from the exact endpoint, filtered to the editing match, on success', async () => {
        mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] }); // handleEditMatch prefetch
        const { result, showMessage } = setup();
        await act(async () => {
          await result.current.handleEditMatch(match); // sets editingMatchId to 'match-1'
        });

        const forThisMatch = makeMedia({ id: 'media-1', match_id: 'match-1' });
        const forOtherMatch = makeMedia({ id: 'media-2', match_id: 'match-2' });
        mockCallAdminApi.mockResolvedValueOnce({}).mockResolvedValueOnce({ data: [forThisMatch, forOtherMatch] });

        await act(async () => {
          await result.current.handleDeleteMedia('media-1');
        });

        expect(showMessage).toHaveBeenCalledWith('Media deleted successfully', 'success');
        expect(mockCallAdminApi).toHaveBeenLastCalledWith('media', 'GET');
        expect(result.current.relatedMedia).toEqual([forThisMatch]);
      });

      it('does not update related media when the reload has no data', async () => {
        mockCallAdminApi.mockResolvedValueOnce({}).mockResolvedValueOnce({});
        const { result } = setup();

        await act(async () => {
          await result.current.handleDeleteMedia('media-1');
        });

        expect(result.current.relatedMedia).toEqual([]);
      });

      it('swallows a reload failure after a successful delete', async () => {
        mockCallAdminApi.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('reload boom'));
        const { result, showMessage } = setup();

        await act(async () => {
          await result.current.handleDeleteMedia('media-1');
        });

        expect(showMessage).toHaveBeenCalledWith('Media deleted successfully', 'success');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error reloading media:', expect.any(Error));
      });

      it('shows an error message when the delete call itself fails', async () => {
        mockCallAdminApi.mockRejectedValueOnce(new Error('delete boom'));
        const { result, showMessage, setLoading } = setup();

        await act(async () => {
          await result.current.handleDeleteMedia('media-1');
        });

        expect(showMessage).toHaveBeenCalledWith('Error deleting media', 'error');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting media:', expect.any(Error));
        expect(setLoading).toHaveBeenLastCalledWith(false);
      });
    });

    describe('handleMediaSubmit', () => {
      it('POSTs a new record with the exact endpoint/payload when not editing', async () => {
        mockCallAdminApi.mockResolvedValueOnce({ data: { id: 'new-media' } }).mockResolvedValueOnce({ data: [] });
        const { result } = setup();
        act(() => result.current.openNewMedia('photo'));
        act(() => result.current.setNewMediaForm({ ...result.current.newMediaForm, url: 'https://x' }));
        const expectedForm = result.current.newMediaForm;

        await act(async () => {
          await result.current.handleMediaSubmit();
        });

        expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'media', 'POST', expectedForm);
      });

      it('PUTs an existing record with the exact endpoint/id/payload when editing', async () => {
        mockCallAdminApi.mockResolvedValueOnce({ data: {} }).mockResolvedValueOnce({ data: [] });
        const { result } = setup();
        const media = makeMedia({ id: 'media-1' });
        act(() => result.current.openEditMedia(media));
        const expectedForm = result.current.newMediaForm;

        await act(async () => {
          await result.current.handleMediaSubmit();
        });

        expect(mockCallAdminApi).toHaveBeenNthCalledWith(1, 'media', 'PUT', { id: 'media-1', ...expectedForm });
      });

      it('shows the response error and does not treat it as success', async () => {
        mockCallAdminApi.mockResolvedValueOnce({ error: 'Validation failed' });
        const { result, showMessage } = setup();
        act(() => result.current.openNewMedia('photo'));

        await act(async () => {
          await result.current.handleMediaSubmit();
        });

        expect(showMessage).toHaveBeenCalledWith('Validation failed', 'error');
        expect(showMessage).not.toHaveBeenCalledWith('Media created successfully', 'success');
        expect(result.current.showMediaModal).toBe(true); // modal was not closed
      });

      it('shows the create-mode success message, closes the modal, and reloads filtered media', async () => {
        const forThisMatch = makeMedia({ id: 'media-new', match_id: 'match-1' });
        const forOtherMatch = makeMedia({ id: 'media-other', match_id: 'match-2' });
        mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] }); // handleEditMatch prefetch
        const { result, showMessage } = setup();
        await act(async () => {
          await result.current.handleEditMatch(match); // sets editingMatchId to 'match-1'
        });
        mockCallAdminApi
          .mockResolvedValueOnce({ data: { id: 'media-new' } }) // POST
          .mockResolvedValueOnce({ data: [forThisMatch, forOtherMatch] }); // reload GET
        act(() => result.current.openNewMedia('photo'));

        await act(async () => {
          await result.current.handleMediaSubmit();
        });

        expect(showMessage).toHaveBeenCalledWith('Media created successfully', 'success');
        expect(result.current.showMediaModal).toBe(false);
        expect(mockCallAdminApi).toHaveBeenLastCalledWith('media', 'GET');
        expect(result.current.relatedMedia).toEqual([forThisMatch]);
      });

      it('shows the update-mode success message when editing', async () => {
        mockCallAdminApi.mockResolvedValueOnce({ data: {} }).mockResolvedValueOnce({ data: [] });
        const { result, showMessage } = setup();
        act(() => result.current.openEditMedia(makeMedia({ id: 'media-1' })));

        await act(async () => {
          await result.current.handleMediaSubmit();
        });

        expect(showMessage).toHaveBeenCalledWith('Media updated successfully', 'success');
      });

      it('does not update related media when the reload has no data', async () => {
        mockCallAdminApi.mockResolvedValueOnce({ data: {} }).mockResolvedValueOnce({});
        const { result } = setup();
        act(() => result.current.openNewMedia('photo'));

        await act(async () => {
          await result.current.handleMediaSubmit();
        });

        expect(result.current.relatedMedia).toEqual([]);
      });

      it('shows the create-mode error message and logs on failure', async () => {
        mockCallAdminApi.mockRejectedValueOnce(new Error('save failed'));
        const { result, showMessage, setLoading } = setup();
        act(() => result.current.openNewMedia('photo'));

        await act(async () => {
          await result.current.handleMediaSubmit();
        });

        expect(showMessage).toHaveBeenCalledWith('Error creating media', 'error');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving media:', expect.any(Error));
        expect(setLoading).toHaveBeenLastCalledWith(false);
      });

      it('shows the update-mode error message on failure when editing', async () => {
        mockCallAdminApi.mockRejectedValueOnce(new Error('save failed'));
        const { result, showMessage } = setup();
        act(() => result.current.openEditMedia(makeMedia({ id: 'media-1' })));

        await act(async () => {
          await result.current.handleMediaSubmit();
        });

        expect(showMessage).toHaveBeenCalledWith('Error updating media', 'error');
      });
    });
  });

  describe('resetTabState', () => {
    it('resets edit mode, editing id, form visibility, and pagination back to page 1', async () => {
      mockCallAdminApi.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
      const secondPageMatches = Array.from({ length: 25 }, (_, i) => ({ ...match, id: `match-${i}` }));
      const { result } = setup({ matches: secondPageMatches });

      await act(async () => {
        await result.current.handleEditMatch(match);
      });
      act(() => result.current.setCurrentPage(2));
      expect(result.current.currentPage).toBe(2);

      act(() => result.current.resetTabState());

      expect(result.current.isEditMode).toBe(false);
      expect(result.current.editingMatchId).toBe(null);
      expect(result.current.showMatchForm).toBe(false);
      expect(result.current.currentPage).toBe(1);
    });
  });
});
