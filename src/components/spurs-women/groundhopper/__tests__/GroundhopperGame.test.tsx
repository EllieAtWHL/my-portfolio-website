import { act, fireEvent, render, screen, within } from '@testing-library/react';
import GroundhopperGame from '../GroundhopperGame';
import type { GroundhopperStadium, LatLng } from '@/lib/groundhopper';

// Leaflet needs a real layout engine, so the map is replaced by two buttons:
// one taps exactly on the shared stadium location below, one taps far away.
jest.mock('../GroundhopperMap', () => ({
  __esModule: true,
  default: ({ interactive, onGuess }: { interactive: boolean; onGuess: (g: LatLng) => void }) => (
    <div data-testid="map" data-interactive={String(interactive)}>
      <button onClick={() => onGuess({ latitude: 51.5, longitude: -0.1 })}>Tap on target</button>
      <button onClick={() => onGuess({ latitude: 40, longitude: 10 })}>Tap far away</button>
    </div>
  ),
}));

// Every stadium shares one location so "Tap on target" scores 100 whichever
// five the daily shuffle picks.
const stadiums: GroundhopperStadium[] = Array.from({ length: 7 }, (_, i) => ({
  id: `stadium-${i}`,
  slug: `stadium-${i}`,
  name: `Ground ${i}`,
  currentName: i === 0 ? `Sponsor Arena ${i}` : null,
  city: 'London',
  country: 'England',
  capacity: 1000 + i,
  openedYear: 1900 + i,
  latitude: 51.5,
  longitude: -0.1,
}));

function playRound(tap: 'Tap on target' | 'Tap far away' = 'Tap on target') {
  fireEvent.click(screen.getByRole('button', { name: tap }));
  fireEvent.click(screen.getByRole('button', { name: 'Lock in guess' }));
  fireEvent.click(screen.getByRole('button', { name: /Next ground|See today/ }));
}

describe('GroundhopperGame', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-28T12:00:00Z'));
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('only lets you lock in once a pin has been dropped', () => {
    render(<GroundhopperGame stadiums={stadiums} />);

    expect(screen.getByText('Ground 1 of 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lock in guess' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Tap far away' }));
    expect(screen.getByRole('button', { name: 'Lock in guess' })).toBeEnabled();
    expect(screen.getByText(/Pin dropped/)).toBeInTheDocument();
  });

  it('reveals the score and distance, then stops the map taking guesses', () => {
    render(<GroundhopperGame stadiums={stadiums} />);

    fireEvent.click(screen.getByRole('button', { name: 'Tap on target' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lock in guess' }));

    expect(screen.getByText(/points · 0 m away/)).toBeInTheDocument();
    expect(screen.getByTestId('map')).toHaveAttribute('data-interactive', 'false');
    expect(screen.getByRole('button', { name: 'Next ground' })).toBeInTheDocument();
  });

  it('plays all five grounds through to a 500 summary and records the streak', () => {
    render(<GroundhopperGame stadiums={stadiums} />);

    for (let i = 0; i < 5; i++) {
      playRound();
    }

    expect(screen.getByText('Groundhopper #1')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText(/Streak 1 day · Best 1/)).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(5);
    expect(JSON.parse(window.localStorage.getItem('groundhopper:v1:streak')!)).toEqual({
      lastPlayed: '2026-10-28',
      current: 1,
      best: 1,
    });
  });

  it('shows the city as a hint and caps that round at 50', () => {
    render(<GroundhopperGame stadiums={stadiums} />);

    fireEvent.click(screen.getByRole('button', { name: /Show the city/ }));
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show the city/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tap on target' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lock in guess' }));
    expect(within(screen.getByRole('status')).getByText('50')).toBeInTheDocument();
  });

  it('keeps the hint (and its 50 cap) across a reload', () => {
    const { unmount } = render(<GroundhopperGame stadiums={stadiums} />);
    fireEvent.click(screen.getByRole('button', { name: /Show the city/ }));
    unmount();

    render(<GroundhopperGame stadiums={stadiums} />);
    expect(screen.queryByRole('button', { name: /Show the city/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tap on target' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lock in guess' }));
    expect(within(screen.getByRole('status')).getByText('50')).toBeInTheDocument();
  });

  it('ignores corrupt saved data instead of crashing', () => {
    window.localStorage.setItem(
      'groundhopper:v1:game',
      JSON.stringify({ dateKey: '2026-10-28', stadiumIds: ['stadium-0'], results: [{}] })
    );
    window.localStorage.setItem('groundhopper:v1:streak', JSON.stringify({ current: 'lots' }));
    render(<GroundhopperGame stadiums={stadiums} />);

    expect(screen.getByText('Ground 1 of 5')).toBeInTheDocument();
    for (let i = 0; i < 5; i++) {
      playRound();
    }
    expect(screen.getByText(/Streak 1 day · Best 1/)).toBeInTheDocument();
  });

  it('picks up where you left off after a reload', () => {
    const { unmount } = render(<GroundhopperGame stadiums={stadiums} />);
    playRound();
    playRound('Tap far away');
    unmount();

    render(<GroundhopperGame stadiums={stadiums} />);
    expect(screen.getByText('Ground 3 of 5')).toBeInTheDocument();
    expect(screen.getByText('100 pts')).toBeInTheDocument();
  });

  it('starts a fresh game the next day', () => {
    const { unmount } = render(<GroundhopperGame stadiums={stadiums} />);
    playRound();
    unmount();

    jest.setSystemTime(new Date('2026-10-29T12:00:00Z'));
    render(<GroundhopperGame stadiums={stadiums} />);
    expect(screen.getByText('Ground 1 of 5')).toBeInTheDocument();
    expect(screen.getByText('0 pts')).toBeInTheDocument();
  });

  it('still plays when localStorage is unavailable', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<GroundhopperGame stadiums={stadiums} />);

    for (let i = 0; i < 5; i++) {
      playRound();
    }
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('copies a spoiler-free result', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<GroundhopperGame stadiums={stadiums} />);
    for (let i = 0; i < 5; i++) {
      playRound();
    }

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy result' }));
    });

    expect(writeText).toHaveBeenCalledWith(
      `Groundhopper #1 - 500/500\n100 · 100 · 100 · 100 · 100\n${window.location.origin}/spurs-women/groundhopper`
    );
    expect(screen.getByText(/Copied/)).toBeInTheDocument();
  });

  it('says so when there are no playable grounds', () => {
    render(<GroundhopperGame stadiums={[]} />);
    expect(screen.getByText(/No grounds are ready to play yet/)).toBeInTheDocument();
  });
});
