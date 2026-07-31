import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPage from '../page';

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

jest.mock('@/lib/api-client', () => ({
  callAdminApi: async (endpoint: string) => {
    if (endpoint === 'teams') return { data: [mockTeam, mockOpponentTeam] };
    if (endpoint === 'matches') return { data: [mockMatch] };
    if (endpoint === 'players') return { data: [mockPlayer] };
    if (endpoint === 'player-stats') return { data: [mockPlayerStat] };
    return { data: [] };
  },
  createEntityAndReload: async () => ({}),
}));

beforeAll(() => {
  window.scrollTo = jest.fn();
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
