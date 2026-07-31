import { render, screen, fireEvent } from '@testing-library/react';
import { MatchesTable } from '../MatchesTable';
import type { Match, Team, Competition } from '@/types/spurs-women-admin';

const spurs: Team = { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', is_tottenham: true, primary_color: null, secondary_color: null };
const arsenal: Team = { id: 2, name: 'Arsenal', short_name: 'ARS', is_tottenham: false, primary_color: null, secondary_color: null };
const competition: Competition = { id: 'comp-1', name: 'Women\'s Super League', type: 'league', nickname: 'WSL' };

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

describe('MatchesTable', () => {
  it('renders a row per match with resolved team/competition names', () => {
    render(<MatchesTable matches={[match]} teams={[spurs, arsenal]} competitions={[competition]} onSelect={() => {}} />);

    expect(screen.getByText('2026-03-01')).toBeInTheDocument();
    expect(screen.getByText('Spurs vs ARS')).toBeInTheDocument();
    expect(screen.getByText('WSL')).toBeInTheDocument();
    expect(screen.getByText('2 - 1')).toBeInTheDocument();
    expect(screen.getByText('Tottenham Hotspur Stadium')).toBeInTheDocument();
  });

  it('calls onSelect with the clicked match when a row is clicked', () => {
    const onSelect = jest.fn();
    render(<MatchesTable matches={[match]} teams={[spurs, arsenal]} competitions={[competition]} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('2026-03-01'));

    expect(onSelect).toHaveBeenCalledWith(match);
  });

  it('renders no rows when there are no matches', () => {
    render(<MatchesTable matches={[]} teams={[]} competitions={[]} onSelect={() => {}} />);

    expect(screen.queryAllByRole('row')).toHaveLength(1); // header row only
  });
});
