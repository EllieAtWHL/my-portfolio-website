import { render, screen, fireEvent } from '@testing-library/react';
import FilteredMatchList from '../FilteredMatchList';
import { Match } from '@/lib/data/matches';

jest.mock('../MatchCard', () => {
  return function MockMatchCard({ match }: { match: Match }) {
    return <div>Match {(match as unknown as { id: string }).id}</div>;
  };
});

const matches = [{ id: 'a' }, { id: 'b' }] as unknown as Match[];

describe('FilteredMatchList', () => {
  it('renders a MatchCard per match', () => {
    render(<FilteredMatchList matches={matches} emptyMessage="No matches found." />);

    expect(screen.getByText('Match a')).toBeInTheDocument();
    expect(screen.getByText('Match b')).toBeInTheDocument();
  });

  it('renders a standalone empty state with no Clear Filters button when onClear is omitted', () => {
    render(<FilteredMatchList matches={[]} emptyMessage="No matches found for this team." />);

    expect(screen.getByText('No matches found for this team.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument();
  });

  it('renders a grid-item empty state with a working Clear Filters button when onClear is provided', () => {
    const onClear = jest.fn();
    render(<FilteredMatchList matches={[]} emptyMessage="No matches found with the current filters." onClear={onClear} />);

    expect(screen.getByText('No matches found with the current filters.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
