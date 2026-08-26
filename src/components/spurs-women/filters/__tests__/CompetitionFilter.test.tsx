import { render, screen, fireEvent } from '@testing-library/react';
import { CompetitionFilter } from '../CompetitionFilter';
import { Match } from '@/lib/data/matches';

const matches = [
  { competitions: { name: 'WSL' } },
  { competitions: { name: 'FA Cup' } },
  { competitions: { name: 'WSL' } },
] as unknown as Match[];

describe('CompetitionFilter', () => {
  it('shows "All" when nothing is selected', () => {
    render(<CompetitionFilter matches={matches} value={[]} onChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: /competition/i })).toHaveTextContent('All');
  });

  it('shows the single selected competition name', () => {
    render(<CompetitionFilter matches={matches} value={['WSL']} onChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: /competition/i })).toHaveTextContent('WSL');
  });

  it('shows a count when multiple competitions are selected', () => {
    render(<CompetitionFilter matches={matches} value={['WSL', 'FA Cup']} onChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: /competition/i })).toHaveTextContent('2 selected');
  });

  it('opens the dropdown and lists the unique competitions from matches', () => {
    render(<CompetitionFilter matches={matches} value={[]} onChange={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /competition/i }));

    expect(screen.getByText('WSL')).toBeInTheDocument();
    expect(screen.getByText('FA Cup')).toBeInTheDocument();
  });

  it('adds a competition to the selection when its checkbox is checked', () => {
    const onChange = jest.fn();
    render(<CompetitionFilter matches={matches} value={[]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /competition/i }));
    fireEvent.click(screen.getByLabelText('WSL'));

    expect(onChange).toHaveBeenCalledWith(['WSL']);
  });

  it('removes a competition from the selection when its checkbox is unchecked', () => {
    const onChange = jest.fn();
    render(<CompetitionFilter matches={matches} value={['WSL']} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /competition/i }));
    fireEvent.click(screen.getByLabelText('WSL'));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('clears the selection when "All" is checked', () => {
    const onChange = jest.fn();
    render(<CompetitionFilter matches={matches} value={['WSL']} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /competition/i }));
    fireEvent.click(screen.getByLabelText('All'));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
