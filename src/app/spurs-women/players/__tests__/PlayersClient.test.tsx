import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlayersClient from '../PlayersClient';

jest.mock('@/lib/data/players', () => ({
  getAllPlayers: jest.fn(),
}));

import { getAllPlayers } from '@/lib/data/players';

const mockGetAllPlayers = getAllPlayers as jest.Mock;

const makePlayer = (overrides: Record<string, unknown> = {}) => ({
  id: '1',
  first_name: 'Bethany',
  last_name: 'England',
  date_of_birth: null,
  nationality: 'England',
  position: 'Forward',
  height_cm: null,
  weight_kg: null,
  profile_image_url: null,
  squad_number: 9,
  legacy_number: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  appearances: 1,
  goals: 0,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
  ...overrides,
});

describe('PlayersClient', () => {
  beforeEach(() => {
    mockGetAllPlayers.mockReset().mockResolvedValue([]);
  });

  it('shows a loading state before the fetch resolves', () => {
    mockGetAllPlayers.mockReturnValue(new Promise(() => {}));

    render(<PlayersClient />);

    expect(screen.getByText('Loading players...')).toBeInTheDocument();
  });

  it('shows a distinguishable error state instead of an empty table when the fetch fails', async () => {
    mockGetAllPlayers.mockRejectedValue(new Error('network down'));

    render(<PlayersClient />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        "Couldn't load players. Please try again."
      );
    });

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders the squad in a sortable table on a successful fetch', async () => {
    mockGetAllPlayers.mockResolvedValue([makePlayer()]);

    render(<PlayersClient />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Bethany England' })).toBeInTheDocument();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('retries the fetch when the error state\'s retry button is clicked', async () => {
    mockGetAllPlayers.mockRejectedValueOnce(new Error('network down')).mockResolvedValue([makePlayer()]);

    render(<PlayersClient />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Bethany England' })).toBeInTheDocument();
    });
    expect(mockGetAllPlayers).toHaveBeenCalledTimes(2);
  });

  it('filters the table by name, position, or nationality as the user types, without paging results away', async () => {
    mockGetAllPlayers.mockResolvedValue([
      makePlayer({ id: '1', first_name: 'Bethany', last_name: 'England', position: 'Forward', nationality: 'England' }),
      makePlayer({ id: '2', first_name: 'Lize', last_name: 'Kop', position: 'Goalkeeper', nationality: 'Netherlands' }),
    ]);

    render(<PlayersClient />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Bethany England' })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Lize Kop' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search players'), { target: { value: 'goalkeeper' } });

    expect(screen.queryByRole('link', { name: 'Bethany England' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lize Kop' })).toBeInTheDocument();
    expect(screen.getByText('1 of 2 players')).toBeInTheDocument();
  });

  it('shows the empty state, not an error, when a search matches no one', async () => {
    mockGetAllPlayers.mockResolvedValue([makePlayer()]);

    render(<PlayersClient />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Bethany England' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Search players'), { target: { value: 'nobody matches this' } });

    expect(screen.getByText('No players to display')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
