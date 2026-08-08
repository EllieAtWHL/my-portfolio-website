import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StadiumClient from '../StadiumClient';
import type { Stadium } from '@/lib/data/stadiums';

jest.mock('@/lib/data/stadiums', () => ({
  getStadiumNames: jest.fn(),
  getMatchesAtStadium: jest.fn(),
}));

jest.mock('@/components/spurs-women/MatchCard', () => {
  return function MockMatchCard() { return null; };
});

jest.mock('@/components/spurs-women/MatchFilterControls', () => {
  return function MockMatchFilterControls() { return null; };
});

jest.mock('@/components/spurs-women/InteractiveMap', () => {
  return function MockInteractiveMap() { return null; };
});

import { getStadiumNames, getMatchesAtStadium } from '@/lib/data/stadiums';

const mockGetStadiumNames = getStadiumNames as jest.Mock;
const mockGetMatchesAtStadium = getMatchesAtStadium as jest.Mock;

const stadium: Stadium = {
  id: 'stadium-1',
  name: 'Brisbane Road',
  slug: 'brisbane-road',
  city: 'London',
  country: 'England',
  capacity: 9500,
  opened_date: null,
  address_line_1: null,
  postcode: null,
  latitude: null,
  longitude: null,
  home_team_id: null,
};

describe('StadiumClient', () => {
  beforeEach(() => {
    mockGetStadiumNames.mockReset().mockResolvedValue([]);
    mockGetMatchesAtStadium.mockReset().mockResolvedValue([]);
  });

  it('shows a distinguishable error state instead of "no matches" when the fetch fails', async () => {
    mockGetMatchesAtStadium.mockRejectedValue(new Error('network down'));

    render(<StadiumClient stadium={stadium} stadiumSlug="brisbane-road" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        "Couldn't load matches for this stadium. Please try again."
      );
    });

    expect(screen.queryByText('No matches found at this stadium.')).not.toBeInTheDocument();
  });

  it('renders the "no matches" empty state on a genuinely successful, empty fetch', async () => {
    render(<StadiumClient stadium={stadium} stadiumSlug="brisbane-road" />);

    await waitFor(() => {
      expect(screen.getByText('No matches found at this stadium.')).toBeInTheDocument();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('retries the fetch when the error state\'s retry button is clicked', async () => {
    mockGetMatchesAtStadium.mockRejectedValueOnce(new Error('network down')).mockResolvedValue([]);

    render(<StadiumClient stadium={stadium} stadiumSlug="brisbane-road" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByText('No matches found at this stadium.')).toBeInTheDocument();
    });
    expect(mockGetMatchesAtStadium).toHaveBeenCalledTimes(2);
  });
});
