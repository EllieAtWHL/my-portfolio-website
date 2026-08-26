import { render, screen, within, fireEvent } from '@testing-library/react';
import PlayerClient from '../PlayerClient';
import type { Player, PlayerMatchAppearance } from '@/lib/data/players';
import type { Match } from '@/lib/data/matches';

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  date: '2026-03-01',
  kickoff_time: '15:00',
  home_team: { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', primary_color: '#132257', secondary_color: '#ffffff', is_tottenham: true },
  away_team: { id: 2, name: 'Chelsea', short_name: 'Chelsea', primary_color: '#034694', secondary_color: '#ffffff', is_tottenham: false },
  spurs_score: 2,
  opponent_score: 1,
  spurs_score_aet: null,
  opponent_score_aet: null,
  spurs_score_pens: null,
  opponent_score_pens: null,
  attended: false,
  is_home_match: true,
  is_neutral_venue: false,
  stadium_id: 'stadium-1',
  stadium_display_name: 'Tottenham Hotspur Stadium',
  stadium_slug: 'tottenham-hotspur-stadium',
  attendance: null,
  notes: null,
  competitions: { name: 'Womens Super League' },
  season_id: 1,
  home_possession: null,
  away_possession: null,
  home_total_shots: null,
  away_total_shots: null,
  home_shots_on_target: null,
  away_shots_on_target: null,
  home_corners: null,
  away_corners: null,
  ...overrides,
});

const statValue = (label: string): string =>
  screen.getByText(label).previousElementSibling!.textContent!;

const makeAppearance = (overrides: Partial<PlayerMatchAppearance> = {}): PlayerMatchAppearance => ({
  match: makeMatch(),
  started: true,
  was_substitute: false,
  was_unused_substitute: false,
  minutes_played: 90,
  goals: 1,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
  player_rating: null,
  player_of_the_match: false,
  ...overrides,
});

const basePlayer: Player = {
  id: 'player-1',
  first_name: 'Bethany',
  last_name: 'England',
  date_of_birth: null,
  nationality: 'England',
  position: 'Forward',
  height_cm: 170,
  weight_kg: 65,
  profile_image_url: null,
  squad_number: 9,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('PlayerClient', () => {
  it('renders the profile photo when profile_image_url is set', () => {
    render(<PlayerClient player={{ ...basePlayer, profile_image_url: 'https://cdn.example.com/photo.webp' }} />);

    const image = screen.getByRole('img', { name: 'Bethany England' });
    // next/image rewrites src through its optimizer proxy (/_next/image?url=...&w=...&q=...),
    // so assert on the underlying url param rather than the raw src.
    const src = image.getAttribute('src') || '';
    const originalUrl = new URL(src, 'http://localhost').searchParams.get('url');
    expect(originalUrl).toBe('https://cdn.example.com/photo.webp');
  });

  it('shows a two-line initials placeholder with squad number instead of hiding the card when there is no photo', () => {
    render(<PlayerClient player={{ ...basePlayer, profile_image_url: null }} />);

    const profileCard = within(screen.getByTestId('player-photo'));
    expect(profileCard.queryByRole('img')).not.toBeInTheDocument();
    expect(profileCard.getByText('BE')).toBeInTheDocument();
    expect(profileCard.getByText('#9')).toBeInTheDocument();
  });

  it('falls back to a last-name-only initial when first_name is missing', () => {
    render(<PlayerClient player={{ ...basePlayer, profile_image_url: null, first_name: null }} />);

    const profileCard = within(screen.getByTestId('player-photo'));
    expect(profileCard.getByText('E')).toBeInTheDocument();
  });

  it('omits the squad number line when the player has none', () => {
    render(<PlayerClient player={{ ...basePlayer, profile_image_url: null, squad_number: null }} />);

    const profileCard = within(screen.getByTestId('player-photo'));
    expect(profileCard.queryByText(/^#/)).not.toBeInTheDocument();
  });

  it('links Current Club to the team page when the player has a current club', () => {
    render(<PlayerClient player={{ ...basePlayer, current_club: { id: 1, name: 'Tottenham Hotspur' } }} />);

    const link = screen.getByRole('link', { name: 'Tottenham Hotspur' });
    expect(link).toHaveAttribute('href', '/spurs-women/teams/1');
  });

  it('shows "No club found" instead of a link when the player has no current club', () => {
    render(<PlayerClient player={{ ...basePlayer, current_club: null }} />);

    expect(screen.getByText('No club found')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /tottenham/i })).not.toBeInTheDocument();
  });

  it('formats date of birth consistently regardless of runtime locale', () => {
    render(<PlayerClient player={{ ...basePlayer, date_of_birth: '1994-06-03' }} />);

    expect(screen.getByText('03/06/1994')).toBeInTheDocument();
  });

  it('renders a Club History entry with team link, dates, squad number, and loan tag', () => {
    render(
      <PlayerClient
        player={{
          ...basePlayer,
          history: [
            {
              team: { id: 5, name: 'Chelsea' },
              joined_on: '2020-07-01',
              left_on: '2023-01-04',
              squad_number: 10,
              is_loan: true,
            },
          ],
        }}
      />
    );

    expect(screen.getByText('Club History')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Chelsea' });
    expect(link).toHaveAttribute('href', '/spurs-women/teams/5');
    expect(screen.getByText('· #10')).toBeInTheDocument();
    expect(screen.getByText('· Loan')).toBeInTheDocument();
    expect(screen.getByText('01/07/2020 – 04/01/2023')).toBeInTheDocument();
  });

  it('shows "Present" for an ongoing history entry with no left_on', () => {
    render(
      <PlayerClient
        player={{
          ...basePlayer,
          history: [
            { team: { id: 1, name: 'Tottenham Hotspur' }, joined_on: '2023-01-05', left_on: null, squad_number: 7, is_loan: false },
          ],
        }}
      />
    );

    expect(screen.getByText('05/01/2023 – Present')).toBeInTheDocument();
  });

  it('does not render the Club History section when history is empty or absent', () => {
    render(<PlayerClient player={{ ...basePlayer, history: [] }} />);
    expect(screen.queryByText('Club History')).not.toBeInTheDocument();
  });

  it('does not render Career Stats or Matches when there is no match history', () => {
    render(<PlayerClient player={basePlayer} matchHistory={[]} />);
    expect(screen.queryByText('Career Stats')).not.toBeInTheDocument();
    expect(screen.queryByText('Matches')).not.toBeInTheDocument();
  });

  it('sums appearances, goals, assists, and cards across all matches into Career Stats', () => {
    const matchHistory = [
      makeAppearance({ match: makeMatch({ id: 'm1' }), goals: 2, assists: 1, yellow_cards: 1, red_cards: 0 }),
      makeAppearance({ match: makeMatch({ id: 'm2', date: '2026-03-08' }), goals: 0, assists: 1, yellow_cards: 0, red_cards: 1 }),
    ];
    render(<PlayerClient player={basePlayer} matchHistory={matchHistory} />);

    expect(screen.getByText('Career Stats')).toBeInTheDocument();
    expect(statValue('Appearances')).toBe('2');
    expect(statValue('Goals')).toBe('2'); // 2 + 0
    expect(statValue('Assists')).toBe('2'); // 1 + 1
    expect(statValue('Yellow Cards')).toBe('1'); // 1 + 0
    expect(statValue('Red Cards')).toBe('1'); // 0 + 1
  });

  it('does not count an unused substitute appearance towards Appearances', () => {
    const matchHistory = [
      makeAppearance({ match: makeMatch({ id: 'm1' }), started: true, was_substitute: false, was_unused_substitute: false }),
      makeAppearance({ match: makeMatch({ id: 'm2' }), started: false, was_substitute: true, was_unused_substitute: false }),
      makeAppearance({ match: makeMatch({ id: 'm3' }), started: false, was_substitute: false, was_unused_substitute: true, minutes_played: 0, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }),
    ];
    render(<PlayerClient player={basePlayer} matchHistory={matchHistory} />);

    expect(statValue('Appearances')).toBe('2');
  });

  it('lists every match from player stats records with opponent, competition, result, and per-match stats', () => {
    const matchHistory = [
      makeAppearance({
        match: makeMatch({ id: 'm1', date: '2026-03-01' }),
        goals: 2,
        assists: 1,
        minutes_played: 90,
      }),
    ];
    render(<PlayerClient player={basePlayer} matchHistory={matchHistory} />);

    expect(screen.getByText('Matches')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Chelsea (H)' });
    expect(link).toHaveAttribute('href', '/spurs-women/matches/m1');
    expect(screen.getByText('Womens Super League')).toBeInTheDocument();
    expect(screen.getByText('2 - 1')).toBeInTheDocument();
    expect(screen.getByText('Started')).toBeInTheDocument();
  });

  it('labels each match row with the player\'s role: Started, Sub (on), or Unused Sub', () => {
    const matchHistory = [
      makeAppearance({ match: makeMatch({ id: 'm1' }), started: true, was_substitute: false, was_unused_substitute: false, minutes_played: 90 }),
      makeAppearance({ match: makeMatch({ id: 'm2' }), started: false, was_substitute: true, was_unused_substitute: false, minutes_played: 20 }),
      makeAppearance({ match: makeMatch({ id: 'm3' }), started: false, was_substitute: false, was_unused_substitute: true, minutes_played: 0 }),
    ];
    render(<PlayerClient player={basePlayer} matchHistory={matchHistory} />);

    expect(screen.getByText('Started')).toBeInTheDocument();
    expect(screen.getByText('Sub (on)')).toBeInTheDocument();
    expect(screen.getByText('Unused Sub')).toBeInTheDocument();
  });

  it('narrows Career Stats and Matches to the selected competition filter', () => {
    const matchHistory = [
      makeAppearance({
        match: makeMatch({ id: 'm1', competitions: { name: 'Womens Super League' } }),
        goals: 3,
      }),
      makeAppearance({
        match: makeMatch({
          id: 'm2',
          competitions: { name: 'FA Cup' },
          away_team: { id: 3, name: 'Arsenal', short_name: 'Arsenal', primary_color: '#EF0107', secondary_color: '#ffffff', is_tottenham: false },
        }),
        goals: 5,
      }),
    ];
    render(<PlayerClient player={basePlayer} matchHistory={matchHistory} />);

    // Both matches show before filtering
    expect(screen.getByRole('link', { name: 'Chelsea (H)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Arsenal (H)' })).toBeInTheDocument();
    expect(statValue('Goals')).toBe('8'); // total goals before filtering (3 + 5)

    fireEvent.click(screen.getByRole('button', { name: 'Expand filters' }));
    fireEvent.click(screen.getByRole('button', { name: 'Competition' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'FA Cup' }));

    expect(screen.queryByRole('link', { name: 'Chelsea (H)' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Arsenal (H)' })).toBeInTheDocument();
    expect(statValue('Goals')).toBe('5'); // goals narrowed to just the FA Cup match
  });
});
