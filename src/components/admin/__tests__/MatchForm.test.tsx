import { render, screen, fireEvent } from '@testing-library/react';
import { MatchForm } from '../MatchForm';

const spurs = { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', is_tottenham: true };
const arsenal = { id: 2, name: 'Arsenal', short_name: 'ARS', is_tottenham: false };
const season = { id: 'season-1', name: '2025/26' };
const competition = { id: 'comp-1', name: "Women's Super League", nickname: 'WSL' };
const stadium = { id: 'stadium-1', name: 'Tottenham Hotspur Stadium', city: 'London' };

const baseForm = {
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
  attended: false,
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
  notes: null,
};

const baseProps = {
  matchForm: baseForm,
  setMatchForm: () => {},
  seasons: [season],
  competitions: [competition],
  teams: [spurs, arsenal],
  stadiums: [stadium],
  isEditMode: false,
  editingMatchId: null,
  loading: false,
  showStatsSection: false,
  showExtraTimeSection: false,
  setShowStatsSection: () => {},
  setShowExtraTimeSection: () => {},
  getCurrentStadiumName: () => 'Tottenham Hotspur Stadium',
  onSubmit: () => {},
  onDelete: () => {},
  onCancel: () => {},
};

describe('MatchForm', () => {
  it('renders the Add title when creating', () => {
    render(<MatchForm {...baseProps} />);

    expect(screen.getByText('Add New Match')).toBeInTheDocument();
  });

  it('renders the Edit title and delete/cancel actions when editing', () => {
    render(<MatchForm {...baseProps} isEditMode editingMatchId="match-1" />);

    expect(screen.getByText('Edit Match')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('calls setMatchForm when season, competition, and date change', () => {
    const setMatchForm = jest.fn();
    render(<MatchForm {...baseProps} setMatchForm={setMatchForm} />);

    fireEvent.change(screen.getByLabelText(/Season/i), { target: { value: 'season-1' } });
    expect(setMatchForm).toHaveBeenCalledWith({ ...baseForm, season_id: 'season-1' });

    fireEvent.change(screen.getByLabelText(/Competition/i), { target: { value: 'comp-1' } });
    expect(setMatchForm).toHaveBeenCalledWith({ ...baseForm, competition_id: 'comp-1' });

    fireEvent.change(screen.getByLabelText(/^Date/i), { target: { value: '2026-04-01' } });
    expect(setMatchForm).toHaveBeenCalledWith({ ...baseForm, date: '2026-04-01' });
  });

  it('switches the opponent field between away and home team based on match type', () => {
    const setMatchForm = jest.fn();
    render(<MatchForm {...baseProps} setMatchForm={setMatchForm} />);

    // Home match: opponent select controls away_team_id
    fireEvent.change(screen.getByLabelText(/Opponent Away Team/i), { target: { value: '2' } });
    expect(setMatchForm).toHaveBeenCalledWith({ ...baseForm, away_team_id: 2 });

    fireEvent.click(screen.getByLabelText('Away Match'));
    expect(setMatchForm).toHaveBeenCalledWith({ ...baseForm, is_home_match: false });
  });

  it('resolves the stadium option label via getCurrentStadiumName', () => {
    const getCurrentStadiumName = jest.fn(() => 'White Hart Lane');
    render(<MatchForm {...baseProps} getCurrentStadiumName={getCurrentStadiumName} />);

    expect(getCurrentStadiumName).toHaveBeenCalledWith('stadium-1', baseForm.date);
    expect(screen.getByText(/White Hart Lane/)).toBeInTheDocument();
  });

  it('calls setMatchForm when scores and attendance change', () => {
    const setMatchForm = jest.fn();
    render(<MatchForm {...baseProps} setMatchForm={setMatchForm} />);

    fireEvent.change(screen.getByLabelText(/Spurs Score/i), { target: { value: '3' } });
    expect(setMatchForm).toHaveBeenCalledWith({ ...baseForm, spurs_score: 3 });

    fireEvent.change(screen.getByLabelText(/Opponent Score/i), { target: { value: '1' } });
    expect(setMatchForm).toHaveBeenCalledWith({ ...baseForm, opponent_score: 1 });

    fireEvent.click(screen.getByLabelText('I attended this match'));
    expect(setMatchForm).toHaveBeenCalledWith({ ...baseForm, attended: true });

    fireEvent.change(screen.getByLabelText(/Attendance/i), { target: { value: '50000' } });
    expect(setMatchForm).toHaveBeenCalledWith({ ...baseForm, attendance: 50000 });
  });

  it('calls setMatchForm when notes change', () => {
    const setMatchForm = jest.fn();
    render(<MatchForm {...baseProps} setMatchForm={setMatchForm} />);

    fireEvent.change(screen.getByLabelText(/Notes/i), { target: { value: 'Great atmosphere' } });

    expect(setMatchForm).toHaveBeenCalledWith({ ...baseForm, notes: 'Great atmosphere' });
  });

  it('toggles the Match Stats section and edits a stat field', () => {
    const setShowStatsSection = jest.fn();
    const { rerender } = render(<MatchForm {...baseProps} setShowStatsSection={setShowStatsSection} />);

    fireEvent.click(screen.getByText('Match Stats'));
    expect(setShowStatsSection).toHaveBeenCalledWith(true);

    const setMatchForm = jest.fn();
    rerender(<MatchForm {...baseProps} showStatsSection setMatchForm={setMatchForm} />);
    // NumberInput only parses as a float when step="any"; this field uses
    // step="0.1", so it still parses with parseInt.
    fireEvent.change(screen.getByLabelText(/Home Possession/i), { target: { value: '55' } });
    expect(setMatchForm).toHaveBeenCalledWith({ ...baseForm, home_possession: 55 });
  });

  it('toggles the Extra Time section and edits a penalties field', () => {
    const setShowExtraTimeSection = jest.fn();
    const { rerender } = render(<MatchForm {...baseProps} setShowExtraTimeSection={setShowExtraTimeSection} />);

    fireEvent.click(screen.getByText('Extra Time'));
    expect(setShowExtraTimeSection).toHaveBeenCalledWith(true);

    const setMatchForm = jest.fn();
    rerender(<MatchForm {...baseProps} showExtraTimeSection setMatchForm={setMatchForm} />);
    fireEvent.change(screen.getByLabelText(/Spurs Score \(Penalties\)/i), { target: { value: '4' } });
    expect(setMatchForm).toHaveBeenCalledWith({ ...baseForm, spurs_score_pens: 4 });
  });

  it('submits the form and calls onDelete/onCancel', () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    const onDelete = jest.fn();
    const onCancel = jest.fn();
    render(<MatchForm {...baseProps} isEditMode editingMatchId="match-1" onSubmit={onSubmit} onDelete={onDelete} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /Update Match/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
