import { render, screen, fireEvent } from '@testing-library/react';
import { TeamsTable } from '../TeamsTable';
import type { Team } from '@/types/spurs-women-admin';

const team: Team = {
  id: 1,
  name: 'Tottenham Hotspur',
  short_name: 'Spurs',
  is_tottenham: true,
  primary_color: '#132257',
  secondary_color: null,
};

describe('TeamsTable', () => {
  it('renders a row per team with name, short name, and colors', () => {
    render(<TeamsTable teams={[team]} onSelect={() => {}} />);

    expect(screen.getByText('Tottenham Hotspur')).toBeInTheDocument();
    expect(screen.getByText('Spurs')).toBeInTheDocument();
    expect(screen.getByText('#132257')).toBeInTheDocument();
  });

  it('shows a placeholder for an unset color', () => {
    render(<TeamsTable teams={[team]} onSelect={() => {}} />);

    expect(screen.getByTitle('No color')).toBeInTheDocument();
  });

  it('calls onSelect with the clicked team', () => {
    const onSelect = jest.fn();
    render(<TeamsTable teams={[team]} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Tottenham Hotspur'));

    expect(onSelect).toHaveBeenCalledWith(team);
  });

  it('shows an empty-state message when there are no teams', () => {
    render(<TeamsTable teams={[]} onSelect={() => {}} />);

    expect(screen.getByText('No teams found')).toBeInTheDocument();
  });
});
