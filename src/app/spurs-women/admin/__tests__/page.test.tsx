import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminPage from '../page';

// This suite is a smoke/integration test for the composed page: it exercises
// prop-wiring between page.tsx and its hooks/components (table row click -> hook
// edit-mode -> form; modal open/submit -> hook -> fetch) that per-unit tests
// (see src/hooks/admin/__tests__ and src/components/admin/**/__tests__) can't
// catch because they mock their collaborators directly. It intentionally does
// NOT re-cover field-by-field form behaviour, pagination math, or every CRUD
// permutation per entity - that's already covered at the unit level.

// The related-record modals (Media/Player Stats/Player History/Stadium Name) use
// plain <label> elements not associated to their control via htmlFor/id, so
// getByLabelText doesn't work there - grab the sibling control by DOM position instead.
// Scoped to the modal card itself, since several of these labels (e.g. "Player",
// "Title", "Name") collide with unrelated table column headers rendered behind the modal.
function getModal(headingText: string): HTMLElement {
  return screen.getByText(headingText).closest('div.bg-gray-800') as HTMLElement;
}

function getFieldInModal(modal: HTMLElement, labelText: string | RegExp): HTMLElement {
  const label = within(modal).getByText(labelText);
  return label.parentElement!.querySelector('input, select, textarea') as HTMLElement;
}

// Related lists render a "New" button per section (e.g. one per media type); scope
// to the specific section's heading to avoid ambiguity between multiple "New"s.
function clickNewButtonNear(headingText: RegExp) {
  const heading = screen.getByText(headingText);
  const header = heading.closest('div')!;
  fireEvent.click(within(header).getByText('New'));
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { email: 'admin@example.com' } } }),
      signOut: async () => ({}),
    },
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockTeam = {
  id: 1,
  name: 'Tottenham Hotspur',
  short_name: 'Spurs',
  is_tottenham: true,
  primary_color: null,
  secondary_color: null,
};

const mockOpponentTeam = {
  id: 2,
  name: 'Arsenal',
  short_name: 'ARS',
  is_tottenham: false,
  primary_color: null,
  secondary_color: null,
};

const mockMatch = {
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

const mockPlayer = {
  id: 'player-1',
  first_name: 'Alice',
  last_name: 'Smith',
  date_of_birth: null,
  nationality: null,
  position: 'Forward',
  height_cm: null,
  weight_kg: null,
  profile_image_url: null,
  squad_number: null,
  created_at: '',
  updated_at: '',
};

// Alice played this match for the home team (Spurs), so the opponent is the away team (Arsenal)
const mockPlayerStat = {
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
};

const mockStadium = {
  id: 'stadium-1',
  name: 'Tottenham Hotspur Stadium',
  slug: 'tottenham-hotspur-stadium',
  city: 'London',
  country: 'England',
  capacity: 62850,
  opened_date: '2019-04-03',
  address_line_1: null,
  postcode: null,
  latitude: null,
  longitude: null,
  home_team_id: 1,
};

const mockSeason = { id: 'season-1', name: '2025/26', start_date: '2025-08-01', end_date: '2026-05-31' };
const mockCompetition = { id: 'comp-1', name: "Barclays Women's Super League", type: 'league', nickname: 'WSL' };

const mockMedia = {
  id: 'media-1',
  match_id: 'match-1',
  type: 'social media' as const,
  title: 'Old title',
  url: 'https://example.com/old',
  caption: null,
  sort_order: 0,
};

async function defaultCallAdminApiImpl(endpoint: string): Promise<{ data: unknown }> {
  if (endpoint === 'teams') return { data: [mockTeam, mockOpponentTeam] };
  if (endpoint === 'matches') return { data: [mockMatch] };
  if (endpoint === 'players') return { data: [mockPlayer] };
  if (endpoint === 'player-stats') return { data: [mockPlayerStat] };
  if (endpoint === 'stadia') return { data: [mockStadium] };
  if (endpoint === 'seasons') return { data: [mockSeason] };
  if (endpoint === 'competitions') return { data: [mockCompetition] };
  if (endpoint === 'media') return { data: [mockMedia] };
  return { data: [] };
}

const callAdminApiMock = jest.fn<Promise<{ data: unknown }>, [string, ...unknown[]]>(
  (endpoint: string) => defaultCallAdminApiImpl(endpoint)
);

const createEntityAndReloadMock = jest.fn<Promise<unknown>, unknown[]>(async () => ({}));

jest.mock('@/lib/api-client', () => ({
  callAdminApi: (...args: [string, ...unknown[]]) => callAdminApiMock(...args),
  createEntityAndReload: (...args: unknown[]) => createEntityAndReloadMock(...args),
}));

beforeAll(() => {
  window.scrollTo = jest.fn();
  window.confirm = jest.fn(() => true);
});

beforeEach(() => {
  callAdminApiMock.mockClear();
  callAdminApiMock.mockImplementation(defaultCallAdminApiImpl);
  createEntityAndReloadMock.mockClear();
  (window.confirm as jest.Mock).mockClear();
  global.fetch = jest.fn(async (url: string, options?: { method?: string }) => {
    const method = options?.method || 'GET';
    if (method === 'GET') {
      if (url.includes('/api/admin/teams')) return { ok: true, json: async () => ({ data: [mockTeam, mockOpponentTeam] }) } as Response;
      if (url.includes('/api/admin/players')) return { ok: true, json: async () => ({ data: [mockPlayer] }) } as Response;
      if (url.includes('/api/admin/matches')) return { ok: true, json: async () => ({ data: [mockMatch] }) } as Response;
    }
    // POST/PUT/DELETE create-and-update calls
    return { ok: true, json: async () => ({ data: { id: 'new-id' } }) } as Response;
  }) as unknown as typeof fetch;
});

describe('AdminPage', () => {
  it('renders all four tabs and switches between them', async () => {
    render(<AdminPage />);

    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: 'Teams' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Players' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Stadiums' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Teams' }));
    expect(await screen.findByText('+ New Team')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Matches' }));
    expect(await screen.findByText('+ New Match')).toBeInTheDocument();
  });

  it('opens the form in edit mode when an existing record is clicked', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('tab', { name: 'Teams' }));
    const teamRow = await screen.findByText('Tottenham Hotspur');
    fireEvent.click(teamRow);

    expect(await screen.findByText('Edit Team')).toBeInTheDocument();
    // The New/Cancel toggle button is hidden while an edit is in progress
    expect(screen.queryByText('+ New Team')).not.toBeInTheDocument();
  });

  it('creates a new team end-to-end through the real form and hooks', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('tab', { name: 'Teams' }));
    fireEvent.click(await screen.findByText('+ New Team'));
    await screen.findByText('Add New Team');

    fireEvent.change(screen.getByLabelText(/Team Name/i), { target: { value: 'Chelsea' } });
    fireEvent.change(screen.getByLabelText(/Short Name/i), { target: { value: 'CHE' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Team/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/teams',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"Chelsea"'),
        })
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Team created successfully');
  });

  it('deletes an existing team after confirming', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('tab', { name: 'Teams' }));
    fireEvent.click(await screen.findByText('Tottenham Hotspur'));
    fireEvent.click(await screen.findByText('Delete'));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith('teams', 'DELETE', { id: mockTeam.id });
    });
    expect(await screen.findByText('Team deleted successfully')).toBeInTheDocument();
  });

  it('adds media to a match via the related-record modal', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(await screen.findByText('2026-03-01'));
    fireEvent.click(await screen.findByText('Related Records'));

    clickNewButtonNear(/^Photo \(/);
    expect(await screen.findByText('Add New Media')).toBeInTheDocument();
    const mediaModal = getModal('Add New Media');

    fireEvent.change(getFieldInModal(mediaModal, 'Title'), { target: { value: 'Matchday programme' } });
    fireEvent.click(within(mediaModal).getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith(
        'media',
        'POST',
        expect.objectContaining({ title: 'Matchday programme', match_id: mockMatch.id })
      );
    });
    expect(await screen.findByText('Media created successfully')).toBeInTheDocument();
  });

  // usePlayerStatsModal is shared between the matches and players tabs, wired to
  // two different hooks' setters (setRelatedPlayerStats vs
  // setRelatedPlayerStatsForPlayer) - this is the riskiest wiring in page.tsx
  // and the one thing a per-hook unit test can't catch, since those tests mock
  // the setters directly rather than exercising the real cross-hook wiring.
  it('adds player stats to a player via the related-record modal, scoped to that player', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('tab', { name: 'Players' }));
    fireEvent.click(await screen.findByText('Alice Smith'));
    fireEvent.click(await screen.findByText('Related Records'));

    clickNewButtonNear(/^Player Stats/);
    const playerStatsModal = getModal('Add Player Stats');

    expect((getFieldInModal(playerStatsModal, 'Player') as HTMLSelectElement).value).toBe(mockPlayer.id);
    fireEvent.change(getFieldInModal(playerStatsModal, 'Match'), { target: { value: mockMatch.id } });
    fireEvent.click(within(playerStatsModal).getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith(
        'player-stats',
        'POST',
        expect.objectContaining({ player_id: mockPlayer.id, match_id: mockMatch.id })
      );
    });
    expect(await screen.findByText('Player stats created successfully')).toBeInTheDocument();
  });
});
