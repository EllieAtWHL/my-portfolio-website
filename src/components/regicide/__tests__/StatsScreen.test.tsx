import { render, screen, fireEvent } from '@testing-library/react';
import { StatsScreen } from '../StatsScreen';
import { DEFAULT_STATS } from '@/hooks/useRegicideGame';

const medalCount = (label: string) => screen.getByText(label).previousElementSibling?.textContent;

describe('StatsScreen', () => {
  afterEach(() => localStorage.clear());

  it('shows saved totals, win rate and per-medal wins', () => {
    localStorage.setItem(
      'regicide-stats',
      JSON.stringify({ ...DEFAULT_STATS, gamesStarted: 4, gamesWon: 3, gamesLost: 1, goldWins: 1, silverWins: 0, bronzeWins: 2 })
    );
    render(<StatsScreen onClose={jest.fn()} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(medalCount('Gold')).toBe('1');
    expect(medalCount('Silver')).toBe('0');
    expect(medalCount('Bronze')).toBe('2');
  });

  it('shows 0 medals for stats saved before medals existed', () => {
    localStorage.setItem(
      'regicide-stats',
      JSON.stringify({ gamesStarted: 5, gamesWon: 2, gamesLost: 3, lastPlayed: 'Never' })
    );
    render(<StatsScreen onClose={jest.fn()} />);

    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(medalCount('Gold')).toBe('0');
    expect(medalCount('Silver')).toBe('0');
    expect(medalCount('Bronze')).toBe('0');
  });

  it('resets to the default stats shape (without persisting the derived win rate)', () => {
    localStorage.setItem(
      'regicide-stats',
      JSON.stringify({ ...DEFAULT_STATS, gamesStarted: 4, gamesWon: 3, goldWins: 3 })
    );
    render(<StatsScreen onClose={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset Statistics' }));

    expect(JSON.parse(localStorage.getItem('regicide-stats')!)).toEqual(DEFAULT_STATS);
    expect(medalCount('Gold')).toBe('0');
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
