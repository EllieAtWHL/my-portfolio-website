import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminPage from '../page';

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
  is_active: true,
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

const mockPlayerHistory = {
  id: 'ph-1',
  player_id: 'player-1',
  team_id: 1,
  joined_on: '2023-01-01',
  left_on: null,
  squad_number: 10,
};

const mockStadiumName = {
  id: 'sn-1',
  stadium_id: 'stadium-1',
  name: 'White Hart Lane',
  valid_from: '1899-01-01',
  valid_to: '2017-05-01',
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
  if (endpoint === 'player-history') return { data: [mockPlayerHistory] };
  if (endpoint === 'stadium-names') return { data: [mockStadiumName] };
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

describe('AdminPage tabs', () => {
  it('renames tabs from "Add X" to the plural entity name', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Matches')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Teams' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Players' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stadiums' })).toBeInTheDocument();

    expect(screen.queryByText('Add Match')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Team')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Player')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Stadium')).not.toBeInTheDocument();
  });

  it('hides the create form by default and reveals it via the New button, per tab', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    // Matches tab is active by default
    expect(screen.queryByText('Add New Match')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+ New Match'));
    expect(await screen.findByText('Add New Match')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Add New Match')).not.toBeInTheDocument());

    // Teams tab
    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));
    await waitFor(() => expect(screen.getByText('+ New Team')).toBeInTheDocument());
    expect(screen.queryByText('Add New Team')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+ New Team'));
    expect(await screen.findByText('Add New Team')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Add New Team')).not.toBeInTheDocument());

    // Players tab
    fireEvent.click(screen.getByRole('button', { name: 'Players' }));
    await waitFor(() => expect(screen.getByText('+ New Player')).toBeInTheDocument());
    expect(screen.queryByText('Add New Player')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+ New Player'));
    expect(await screen.findByText('Add New Player')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Add New Player')).not.toBeInTheDocument());

    // Stadiums tab
    fireEvent.click(screen.getByRole('button', { name: 'Stadiums' }));
    await waitFor(() => expect(screen.getByText('+ New Stadium')).toBeInTheDocument());
    expect(screen.queryByText('Add New Stadium')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+ New Stadium'));
    expect(await screen.findByText('Add New Stadium')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Add New Stadium')).not.toBeInTheDocument());
  });

  it('hides the create form again after switching tabs and back', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByText('+ New Match'));
    expect(await screen.findByText('Add New Match')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));
    await waitFor(() => expect(screen.getByText('+ New Team')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Matches' }));
    await waitFor(() => expect(screen.getByText('+ New Match')).toBeInTheDocument());
    expect(screen.queryByText('Add New Match')).not.toBeInTheDocument();
  });

  it('opens the form in edit mode (without a New click) when an existing record is clicked', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));
    const teamRow = await screen.findByText('Tottenham Hotspur');
    fireEvent.click(teamRow);

    expect(await screen.findByText('Edit Team')).toBeInTheDocument();
    // The New/Cancel toggle button is hidden while an edit is in progress
    expect(screen.queryByText('+ New Team')).not.toBeInTheDocument();
  });

  it('shows the match opponent in a player\'s related Player Stats list', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Players' }));
    const playerRow = await screen.findByText('Alice Smith');
    fireEvent.click(playerRow);

    fireEvent.click(await screen.findByText('Related Records'));

    expect(await screen.findByText('Opponent')).toBeInTheDocument();
    expect(await screen.findByText('ARS')).toBeInTheDocument();
  });
});

describe('AdminPage CRUD flows', () => {
  it('creates a new team', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));
    fireEvent.click(await screen.findByText('+ New Team'));
    await screen.findByText('Add New Team');

    fireEvent.change(screen.getByLabelText(/Team Name/i), { target: { value: 'Chelsea' } });
    fireEvent.change(screen.getByLabelText(/Short Name/i), { target: { value: 'CHE' } });

    // Pick a primary color via the ColorPicker swatch grid, not just the raw text input
    fireEvent.click(screen.getAllByText('None')[0]);
    expect(await screen.findByText('Select a Color')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('blue-500'));
    await waitFor(() => expect(screen.queryByText('Select a Color')).not.toBeInTheDocument());

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
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/teams',
      expect.objectContaining({ body: expect.stringContaining('"primary_color":"blue-500"') })
    );
    expect(await screen.findByText('Team created successfully')).toBeInTheDocument();
  });

  it('updates an existing team', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));
    fireEvent.click(await screen.findByText('Tottenham Hotspur'));
    await screen.findByText('Edit Team');

    fireEvent.change(screen.getByLabelText(/Short Name/i), { target: { value: 'THFC' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Team/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/teams',
        expect.objectContaining({ method: 'PUT', body: expect.stringContaining('"short_name":"THFC"') })
      );
    });
    expect(await screen.findByText('Team updated successfully')).toBeInTheDocument();
  });

  it('shows an inline error message when team creation fails', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({ error: 'Short name already taken' }),
    })) as unknown as typeof fetch;

    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));
    fireEvent.click(await screen.findByText('+ New Team'));
    await screen.findByText('Add New Team');

    fireEvent.change(screen.getByLabelText(/Team Name/i), { target: { value: 'Chelsea' } });
    fireEvent.change(screen.getByLabelText(/Short Name/i), { target: { value: 'CHE' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Team/i }));

    expect(await screen.findByText('Error creating team: Short name already taken')).toBeInTheDocument();
  });

  it('deletes an existing team after confirming', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));
    fireEvent.click(await screen.findByText('Tottenham Hotspur'));
    fireEvent.click(await screen.findByText('Delete'));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith('teams', 'DELETE', { id: mockTeam.id });
    });
    expect(await screen.findByText('Team deleted successfully')).toBeInTheDocument();
  });

  it('creates a new player', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Players' }));
    fireEvent.click(await screen.findByText('+ New Player'));
    await screen.findByText('Add New Player');

    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Jones' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '2000-05-01' } });
    fireEvent.change(screen.getByLabelText(/Nationality/i), { target: { value: 'England' } });
    fireEvent.change(screen.getByLabelText(/^Position/i), { target: { value: 'Midfielder' } });
    fireEvent.change(screen.getByLabelText(/Height/i), { target: { value: '170' } });
    fireEvent.change(screen.getByLabelText(/Weight/i), { target: { value: '65' } });
    fireEvent.change(screen.getByLabelText(/Profile Image URL/i), { target: { value: 'https://example.com/jones.jpg' } });
    fireEvent.change(screen.getByLabelText(/Is Active/i), { target: { value: 'false' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Player/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/players',
        expect.objectContaining({ method: 'POST', body: expect.stringContaining('"last_name":"Jones"') })
      );
    });
    expect(await screen.findByText('Player created successfully')).toBeInTheDocument();
  });

  it('updates an existing player', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Players' }));
    fireEvent.click(await screen.findByText('Alice Smith'));
    await screen.findByText('Edit Player');

    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Jones' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Player/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/players',
        expect.objectContaining({ method: 'PUT', body: expect.stringContaining('"last_name":"Jones"') })
      );
    });
    expect(await screen.findByText('Player updated successfully')).toBeInTheDocument();
  });

  it('deletes an existing player after confirming', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Players' }));
    fireEvent.click(await screen.findByText('Alice Smith'));
    fireEvent.click(await screen.findByText('Delete'));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith('players', 'DELETE', { id: mockPlayer.id });
    });
    expect(await screen.findByText('Player deleted successfully')).toBeInTheDocument();
  });

  it('creates a new stadium', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Stadiums' }));
    fireEvent.click(await screen.findByText('+ New Stadium'));
    await screen.findByText('Add New Stadium');

    fireEvent.change(screen.getByLabelText(/Stadium Name/i), { target: { value: 'Emirates Stadium' } });
    fireEvent.change(screen.getByLabelText(/Slug/i), { target: { value: 'emirates-stadium' } });
    fireEvent.change(screen.getByLabelText(/^City/i), { target: { value: 'London' } });
    fireEvent.change(screen.getByLabelText(/Country/i), { target: { value: 'England' } });
    fireEvent.change(screen.getByLabelText(/Capacity/i), { target: { value: '60704' } });
    fireEvent.change(screen.getByLabelText(/Opened Date/i), { target: { value: '2006-07-22' } });
    fireEvent.change(screen.getByLabelText(/Address Line 1/i), { target: { value: 'Hornsey Road' } });
    fireEvent.change(screen.getByLabelText(/Postcode/i), { target: { value: 'N7 7AJ' } });
    fireEvent.change(screen.getByLabelText(/Home Team/i), { target: { value: mockOpponentTeam.id.toString() } });
    fireEvent.change(screen.getByLabelText(/Latitude/i), { target: { value: '51.555' } });
    fireEvent.change(screen.getByLabelText(/Longitude/i), { target: { value: '-0.108' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Stadium/i }));

    await waitFor(() => {
      expect(createEntityAndReloadMock).toHaveBeenCalledWith(
        'stadia',
        expect.objectContaining({ name: 'Emirates Stadium', slug: 'emirates-stadium' }),
        'stadia',
        expect.any(Function)
      );
    });
    expect(await screen.findByText('Stadium created successfully')).toBeInTheDocument();
  });

  it('updates an existing stadium', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Stadiums' }));
    fireEvent.click(await screen.findByText('Tottenham Hotspur Stadium'));
    await screen.findByText('Edit Stadium');

    fireEvent.change(screen.getByLabelText(/^Stadium Name/i), { target: { value: 'New Stadium Name' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Stadium/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/stadia',
        expect.objectContaining({ method: 'PUT', body: expect.stringContaining('"name":"New Stadium Name"') })
      );
    });
    expect(await screen.findByText('Stadium updated successfully')).toBeInTheDocument();
  });

  it('deletes an existing stadium after confirming', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Stadiums' }));
    fireEvent.click(await screen.findByText('Tottenham Hotspur Stadium'));
    fireEvent.click(await screen.findByText('Delete'));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith('stadia', 'DELETE', { id: mockStadium.id });
    });
    expect(await screen.findByText('Stadium deleted successfully')).toBeInTheDocument();
  });

  it('deletes an existing match after confirming', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(await screen.findByText('2026-03-01'));
    fireEvent.click(await screen.findByText('Delete'));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith('matches', 'DELETE', { id: mockMatch.id });
    });
    expect(await screen.findByText('Match deleted successfully')).toBeInTheDocument();
  });

  it('creates a new match', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByText('+ New Match'));
    await screen.findByText('Add New Match');

    fireEvent.change(screen.getByLabelText(/Season/i), { target: { value: mockSeason.id } });
    fireEvent.change(screen.getByLabelText(/Competition/i), { target: { value: mockCompetition.id } });
    fireEvent.change(screen.getByLabelText(/^Date/i), { target: { value: '2026-04-01' } });
    fireEvent.change(screen.getByLabelText(/Kickoff Time/i), { target: { value: '15:00' } });
    fireEvent.change(screen.getByLabelText(/Opponent .* Team/i), { target: { value: mockOpponentTeam.id.toString() } });
    fireEvent.change(screen.getByLabelText(/^Stadium/i), { target: { value: mockStadium.id } });
    fireEvent.change(screen.getByLabelText(/^Spurs Score/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/^Opponent Score/i), { target: { value: '1' } });
    fireEvent.click(screen.getByLabelText(/I attended this match/i));
    fireEvent.change(screen.getByLabelText(/Attendance/i), { target: { value: '60000' } });
    fireEvent.change(screen.getByLabelText(/Notes/i), { target: { value: 'Great win' } });

    fireEvent.click(screen.getByText('Match Stats'));
    fireEvent.change(await screen.findByLabelText(/Home Possession/i), { target: { value: '55' } });
    fireEvent.change(screen.getByLabelText(/Away Possession/i), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText(/Home Total Shots/i), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText(/Away Total Shots/i), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/Home Shots On Target/i), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText(/Away Shots On Target/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/Home Corners/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Away Corners/i), { target: { value: '2' } });

    fireEvent.click(screen.getByText('Extra Time'));
    fireEvent.change(await screen.findByLabelText(/Spurs Score \(AET\)/i), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText(/Opponent Score \(AET\)/i), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText(/Spurs Score \(Penalties\)/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Opponent Score \(Penalties\)/i), { target: { value: '4' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Match/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/matches',
        expect.objectContaining({ method: 'POST', body: expect.stringContaining('"competition_id":"comp-1"') })
      );
    });
    expect(await screen.findByText('Match created successfully')).toBeInTheDocument();
  });

  it('shows an inline error instead of submitting when required match fields are missing', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByText('+ New Match'));
    await screen.findByText('Add New Match');

    // Only fill season - competition/date/opponent are still blank
    fireEvent.change(screen.getByLabelText(/Season/i), { target: { value: mockSeason.id } });
    fireEvent.change(screen.getByLabelText(/Competition/i), { target: { value: mockCompetition.id } });
    fireEvent.change(screen.getByLabelText(/^Date/i), { target: { value: '2026-04-01' } });
    fireEvent.change(screen.getByLabelText(/Opponent .* Team/i), { target: { value: mockOpponentTeam.id.toString() } });
    // Deliberately leave Stadium blank - browser-native `required` validation
    // blocks the submit event, so this exercises the no-op path rather than handleMatchSubmit.
    fireEvent.click(screen.getByRole('button', { name: /Create Match/i }));

    // Give any (unwanted) async submission a tick to resolve, then confirm nothing was sent
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(global.fetch).not.toHaveBeenCalledWith('/api/admin/matches', expect.anything());
  });

  it('expands the Match Stats and Extra Time collapsible sections', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByText('+ New Match'));
    await screen.findByText('Add New Match');

    fireEvent.click(screen.getByText('Match Stats'));
    expect(await screen.findByLabelText(/Home Possession/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Extra Time'));
    expect(await screen.findByLabelText(/Spurs Score \(AET\)/i)).toBeInTheDocument();
  });

  it('switches between Details and Related Records sub-tabs while editing a match', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(await screen.findByText('2026-03-01'));
    await screen.findByText('Edit Match');

    fireEvent.click(screen.getByText('Related Records'));
    expect(await screen.findByText(/Player Stats/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Details'));
    expect(await screen.findByText('Edit Match')).toBeInTheDocument();
  });

  it('filters the teams list by search term', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));
    await screen.findByText('Arsenal');

    const searchBox = screen.getByPlaceholderText('Search teams by name or short name...');
    fireEvent.change(searchBox, { target: { value: 'Arsenal' } });

    await waitFor(() => {
      expect(screen.queryByText('Tottenham Hotspur')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Arsenal')).toBeInTheDocument();
    expect(screen.getByText('All Teams (1 filtered)')).toBeInTheDocument();
  });

  it('paginates the teams list once there are more than 20 teams', async () => {
    const manyTeams = Array.from({ length: 25 }, (_, i) => ({
      id: i + 10,
      name: `Team ${i}`,
      short_name: `T${i}`,
      is_tottenham: false,
      primary_color: null,
      secondary_color: null,
    }));
    callAdminApiMock.mockImplementation(async (endpoint: string) => {
      if (endpoint === 'teams') return { data: manyTeams };
      return defaultCallAdminApiImpl(endpoint);
    });

    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Team 0')).toBeInTheDocument();
    expect(screen.queryByText('Team 20')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Page 2 of 2')).toBeInTheDocument());
    expect(screen.getByText('Team 20')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Previous'));
    await waitFor(() => expect(screen.getByText('Page 1 of 2')).toBeInTheDocument());
  });

  it('paginates the players list once there are more than 20 players', async () => {
    const manyPlayers = Array.from({ length: 25 }, (_, i) => ({
      id: `player-${i}`,
      first_name: 'Test',
      last_name: `Player${i}`,
      date_of_birth: null,
      nationality: null,
      position: null,
      height_cm: null,
      weight_kg: null,
      profile_image_url: null,
      squad_number: null,
      is_active: true,
      created_at: '',
      updated_at: '',
    }));
    callAdminApiMock.mockImplementation(async (endpoint: string) => {
      if (endpoint === 'players') return { data: manyPlayers };
      return defaultCallAdminApiImpl(endpoint);
    });

    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Players' }));

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Test Player0')).toBeInTheDocument();
    expect(screen.queryByText('Test Player20')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Page 2 of 2')).toBeInTheDocument());
    expect(screen.getByText('Test Player20')).toBeInTheDocument();
  });

  it('paginates the stadiums list once there are more than 20 stadiums', async () => {
    const manyStadiums = Array.from({ length: 25 }, (_, i) => ({
      id: `stadium-${i}`,
      name: `Stadium ${i}`,
      slug: `stadium-${i}`,
      city: null,
      country: null,
      capacity: null,
      opened_date: null,
      address_line_1: null,
      postcode: null,
      latitude: null,
      longitude: null,
      home_team_id: null,
    }));
    callAdminApiMock.mockImplementation(async (endpoint: string) => {
      if (endpoint === 'stadia') return { data: manyStadiums };
      return defaultCallAdminApiImpl(endpoint);
    });

    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Stadiums' }));

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Stadium 0')).toBeInTheDocument();
    expect(screen.queryByText('Stadium 20')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Page 2 of 2')).toBeInTheDocument());
    expect(screen.getByText('Stadium 20')).toBeInTheDocument();
  });

  it('paginates the matches list once there are more than 20 matches', async () => {
    const manyMatches = Array.from({ length: 25 }, (_, i) => ({
      ...mockMatch,
      id: `match-${i}`,
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    }));
    callAdminApiMock.mockImplementation(async (endpoint: string) => {
      if (endpoint === 'matches') return { data: manyMatches };
      return defaultCallAdminApiImpl(endpoint);
    });

    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('2026-01-01')).toBeInTheDocument();
    expect(screen.queryByText('2026-01-21')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Page 2 of 2')).toBeInTheDocument());
    expect(screen.getByText('2026-01-21')).toBeInTheDocument();
  });
});

describe('AdminPage related-record modals', () => {
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

  it('edits an existing media item via the related-record modal', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(await screen.findByText('2026-03-01'));
    fireEvent.click(await screen.findByText('Related Records'));
    fireEvent.click(await screen.findByText('Old title'));

    expect(await screen.findByText('Edit Media')).toBeInTheDocument();
    const editMediaModal = getModal('Edit Media');
    fireEvent.change(getFieldInModal(editMediaModal, 'Title'), { target: { value: 'New title' } });
    fireEvent.click(within(editMediaModal).getByRole('button', { name: 'Update' }));

    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith(
        'media',
        'PUT',
        expect.objectContaining({ id: mockMedia.id, title: 'New title' })
      );
    });
    expect(await screen.findByText('Media updated successfully')).toBeInTheDocument();
  });

  it('deletes an existing media item after confirming', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(await screen.findByText('2026-03-01'));
    fireEvent.click(await screen.findByText('Related Records'));
    fireEvent.click(await screen.findByText('Old title'));

    expect(await screen.findByText('Edit Media')).toBeInTheDocument();
    const deleteMediaModal = getModal('Edit Media');
    fireEvent.click(within(deleteMediaModal).getByRole('button', { name: 'Delete' }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith('media', 'DELETE', { id: mockMedia.id });
    });
  });

  it('adds player stats to a match via the related-record modal', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(await screen.findByText('2026-03-01'));
    fireEvent.click(await screen.findByText('Related Records'));

    clickNewButtonNear(/^Player Stats/);
    expect(await screen.findByText('Add Player Stats')).toBeInTheDocument();
    const playerStatsModal = getModal('Add Player Stats');

    fireEvent.change(getFieldInModal(playerStatsModal, 'Player'), { target: { value: mockPlayer.id } });
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

  it('shows an inline error instead of submitting player stats without a player or match', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(await screen.findByText('2026-03-01'));
    fireEvent.click(await screen.findByText('Related Records'));

    clickNewButtonNear(/^Player Stats/);
    expect(await screen.findByText('Add Player Stats')).toBeInTheDocument();
    const playerStatsModal2 = getModal('Add Player Stats');

    fireEvent.click(within(playerStatsModal2).getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Player and Match are both required')).toBeInTheDocument();
    expect(callAdminApiMock).not.toHaveBeenCalledWith('player-stats', 'POST', expect.anything());
  });

  it('adds player history to a player via the related-record modal', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Players' }));
    fireEvent.click(await screen.findByText('Alice Smith'));
    fireEvent.click(await screen.findByText('Related Records'));

    clickNewButtonNear(/^Player History/);
    expect(await screen.findByText('Add Player History')).toBeInTheDocument();
    const playerHistoryModal = getModal('Add Player History');

    fireEvent.change(getFieldInModal(playerHistoryModal, 'Joined On'), { target: { value: '2024-07-01' } });
    fireEvent.click(within(playerHistoryModal).getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith(
        'player-history',
        'POST',
        expect.objectContaining({ joined_on: '2024-07-01' })
      );
    });
    expect(await screen.findByText('Player history created successfully')).toBeInTheDocument();
  });

  it('edits an existing player history record via the related-record modal', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Players' }));
    fireEvent.click(await screen.findByText('Alice Smith'));
    fireEvent.click(await screen.findByText('Related Records'));
    fireEvent.click(await screen.findByText('2023-01-01'));

    expect(await screen.findByText('Edit Player History')).toBeInTheDocument();
    const editHistoryModal = getModal('Edit Player History');
    fireEvent.change(getFieldInModal(editHistoryModal, 'Joined On'), { target: { value: '2023-08-01' } });
    fireEvent.click(within(editHistoryModal).getByRole('button', { name: 'Update' }));

    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith(
        'player-history',
        'PUT',
        expect.objectContaining({ id: mockPlayerHistory.id, joined_on: '2023-08-01' })
      );
    });
    expect(await screen.findByText('Player history updated successfully')).toBeInTheDocument();
  });

  it('deletes an existing player history record after confirming', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Players' }));
    fireEvent.click(await screen.findByText('Alice Smith'));
    fireEvent.click(await screen.findByText('Related Records'));
    fireEvent.click(await screen.findByText('2023-01-01'));

    expect(await screen.findByText('Edit Player History')).toBeInTheDocument();
    const deleteHistoryModal = getModal('Edit Player History');
    fireEvent.click(within(deleteHistoryModal).getByRole('button', { name: 'Delete' }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith('player-history', 'DELETE', { id: mockPlayerHistory.id });
    });
  });

  it('adds a stadium name to a stadium via the related-record modal', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Stadiums' }));
    fireEvent.click(await screen.findByText('Tottenham Hotspur Stadium'));
    fireEvent.click(await screen.findByText('Related Records'));

    clickNewButtonNear(/^Stadium Names/);
    expect(await screen.findByText('Add Stadium Name')).toBeInTheDocument();
    const stadiumNameModal = getModal('Add Stadium Name');

    fireEvent.change(getFieldInModal(stadiumNameModal, 'Name'), { target: { value: 'White Hart Lane' } });
    fireEvent.change(getFieldInModal(stadiumNameModal, 'Valid From'), { target: { value: '2000-01-01' } });
    fireEvent.click(within(stadiumNameModal).getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith(
        'stadium-names',
        'POST',
        expect.objectContaining({ name: 'White Hart Lane', valid_from: '2000-01-01' })
      );
    });
    expect(await screen.findByText('Stadium name created successfully')).toBeInTheDocument();
  });

  it('edits an existing stadium name via the related-record modal', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Stadiums' }));
    fireEvent.click(await screen.findByText('Tottenham Hotspur Stadium'));
    fireEvent.click(await screen.findByText('Related Records'));
    fireEvent.click(await screen.findByText('White Hart Lane'));

    expect(await screen.findByText('Edit Stadium Name')).toBeInTheDocument();
    const editStadiumNameModal = getModal('Edit Stadium Name');
    fireEvent.change(getFieldInModal(editStadiumNameModal, 'Name'), { target: { value: 'White Hart Lane (renamed)' } });
    fireEvent.click(within(editStadiumNameModal).getByRole('button', { name: 'Update' }));

    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith(
        'stadium-names',
        'PUT',
        expect.objectContaining({ id: mockStadiumName.id, name: 'White Hart Lane (renamed)' })
      );
    });
    expect(await screen.findByText('Stadium name updated successfully')).toBeInTheDocument();
  });

  it('deletes an existing stadium name after confirming', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Stadiums' }));
    fireEvent.click(await screen.findByText('Tottenham Hotspur Stadium'));
    fireEvent.click(await screen.findByText('Related Records'));
    fireEvent.click(await screen.findByText('White Hart Lane'));

    expect(await screen.findByText('Edit Stadium Name')).toBeInTheDocument();
    const deleteStadiumNameModal = getModal('Edit Stadium Name');
    fireEvent.click(within(deleteStadiumNameModal).getByRole('button', { name: 'Delete' }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(callAdminApiMock).toHaveBeenCalledWith('stadium-names', 'DELETE', { id: mockStadiumName.id });
    });
  });

  it('shows an inline error instead of submitting a stadium name without Valid From', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Matches')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Stadiums' }));
    fireEvent.click(await screen.findByText('Tottenham Hotspur Stadium'));
    fireEvent.click(await screen.findByText('Related Records'));

    clickNewButtonNear(/^Stadium Names/);
    expect(await screen.findByText('Add Stadium Name')).toBeInTheDocument();
    const stadiumNameModal2 = getModal('Add Stadium Name');

    fireEvent.change(getFieldInModal(stadiumNameModal2, 'Name'), { target: { value: 'White Hart Lane' } });
    fireEvent.click(within(stadiumNameModal2).getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Valid From is required')).toBeInTheDocument();
    expect(callAdminApiMock).not.toHaveBeenCalledWith('stadium-names', 'POST', expect.anything());
  });
});
