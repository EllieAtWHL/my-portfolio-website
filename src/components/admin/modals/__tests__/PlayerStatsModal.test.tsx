import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerStatsModal } from '../PlayerStatsModal';
import type { PlayerStats, Player, Match, Team } from '@/types/spurs-women-admin';

const spurs: Team = { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', is_tottenham: true, primary_color: null, secondary_color: null };
const arsenal: Team = { id: 2, name: 'Arsenal', short_name: 'ARS', is_tottenham: false, primary_color: null, secondary_color: null };

const player: Player = {
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

const match: Match = {
  id: 'match-1',
  season_id: 'season-1',
  competition_id: 'comp-1',
  date: '2026-03-01',
  kickoff_time: '15:00',
  is_home_match: true,
  spurs_score: null,
  opponent_score: null,
  spurs_score_aet: null,
  opponent_score_aet: null,
  spurs_score_pens: null,
  opponent_score_pens: null,
  stadium_id: 'stadium-1',
  stadium_display_name: null,
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

const baseForm: Partial<PlayerStats> = {
  player_id: '',
  match_id: '',
  team_id: 1,
  started: false,
  captain: false,
  goals: 0,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
  minute_on: null,
  minute_off: null,
  player_rating: null,
};

const baseProps = {
  form: baseForm,
  onChange: () => {},
  error: null,
  players: [player],
  matches: [match],
  teams: [spurs, arsenal],
  onCancel: () => {},
  onDelete: () => {},
  onSubmit: () => {},
};

describe('PlayerStatsModal', () => {
  it('renders the player and match options', () => {
    render(<PlayerStatsModal {...baseProps} editingPlayerStatsId={null} />);

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('2026-03-01 - Spurs vs ARS')).toBeInTheDocument();
  });

  it('shows a validation error when provided', () => {
    render(<PlayerStatsModal {...baseProps} editingPlayerStatsId={null} error="Player and Match are both required" />);

    expect(screen.getByText('Player and Match are both required')).toBeInTheDocument();
  });

  it('only shows Delete when editing an existing record', () => {
    const { rerender } = render(<PlayerStatsModal {...baseProps} editingPlayerStatsId={null} />);
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();

    rerender(<PlayerStatsModal {...baseProps} editingPlayerStatsId="stat-1" />);
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onChange when the goals field changes', () => {
    const onChange = jest.fn();
    render(<PlayerStatsModal {...baseProps} editingPlayerStatsId={null} onChange={onChange} />);

    const goalsInput = screen.getAllByDisplayValue('0')[0];
    fireEvent.change(goalsInput, { target: { value: '3' } });

    expect(onChange).toHaveBeenCalledWith({ ...baseForm, goals: 3 });
  });

  it('calls onSubmit, onCancel, and onDelete', () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    const onDelete = jest.fn();
    render(
      <PlayerStatsModal
        {...baseProps}
        editingPlayerStatsId="stat-1"
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByText('Update'));
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByText('Delete'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
