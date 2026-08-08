import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MatchesClient from '../MatchesClient';

jest.mock('@/lib/data/matches', () => ({
  getMatchesWithFilter: jest.fn(),
}));

jest.mock('@/components/spurs-women/MatchCard', () => {
  return function MockMatchCard() { return null; };
});

jest.mock('@/components/spurs-women/MatchFilterControls', () => {
  return function MockMatchFilterControls() { return null; };
});

import { getMatchesWithFilter } from '@/lib/data/matches';

const mockGetMatchesWithFilter = getMatchesWithFilter as jest.Mock;

describe('MatchesClient', () => {
  beforeEach(() => {
    mockGetMatchesWithFilter.mockReset().mockResolvedValue([]);
  });

  it('shows a loading state before the fetch resolves', () => {
    mockGetMatchesWithFilter.mockReturnValue(new Promise(() => {}));

    render(<MatchesClient />);

    expect(screen.getByText('Loading matches...')).toBeInTheDocument();
  });

  it('shows a distinguishable error state instead of "no matches" when the fetch fails', async () => {
    mockGetMatchesWithFilter.mockRejectedValue(new Error('network down'));

    render(<MatchesClient />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        "Couldn't load matches. Please try again."
      );
    });

    expect(screen.queryByText('No matches found with the current filters.')).not.toBeInTheDocument();
  });

  it('renders the "no matches" empty state on a genuinely successful, empty fetch', async () => {
    render(<MatchesClient />);

    await waitFor(() => {
      expect(screen.getByText('No matches found with the current filters.')).toBeInTheDocument();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('retries the fetch when the error state\'s retry button is clicked', async () => {
    mockGetMatchesWithFilter.mockRejectedValueOnce(new Error('network down')).mockResolvedValue([]);

    render(<MatchesClient />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByText('No matches found with the current filters.')).toBeInTheDocument();
    });
    expect(mockGetMatchesWithFilter).toHaveBeenCalledTimes(2);
  });
});
