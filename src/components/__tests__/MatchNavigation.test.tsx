import { render, screen, fireEvent } from '@testing-library/react';
import MatchNavigation from '../spurs-women/MatchNavigation';
import type { Match, MatchNavSummary } from '@/lib/data/matches';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

// `useTransition` is mocked so tests can force `isPending` deterministically
// instead of racing React's real transition scheduling (the mocked
// `router.push` has no actual async work for React to suspend on).
let mockIsPending = false;
const mockStartTransition = jest.fn((callback: () => void) => callback());

jest.mock('react', () => {
  const actualReact = jest.requireActual('react');
  return {
    ...actualReact,
    useTransition: () => [mockIsPending, mockStartTransition],
  };
});

const team = (overrides: Partial<NonNullable<Match['home_team']>>) => ({
  id: 1,
  name: 'Tottenham Hotspur',
  short_name: 'Spurs',
  primary_color: '#132257',
  secondary_color: '#ffffff',
  is_tottenham: true,
  ...overrides,
});

const baseMatch: Match = {
  id: 'current-1',
  date: '2026-05-03',
  kickoff_time: '12:00:00',
  home_team: team({ id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs' }),
  away_team: team({ id: 2, name: 'Manchester United', short_name: 'Man Utd', is_tottenham: false }),
  spurs_score: 2,
  opponent_score: 1,
  spurs_score_aet: null,
  opponent_score_aet: null,
  spurs_score_pens: null,
  opponent_score_pens: null,
  attended: false,
  is_home_match: true,
  is_neutral_venue: false,
  stadium_id: 'stadium-1',
  stadium_display_name: 'Tottenham Hotspur Stadium',
  stadium_slug: 'thfc-stadium',
  attendance: null,
  notes: null,
  competitions: null,
  season_id: 1,
  home_possession: null,
  away_possession: null,
  home_total_shots: null,
  away_total_shots: null,
  home_shots_on_target: null,
  away_shots_on_target: null,
  home_corners: null,
  away_corners: null,
};

const previousMatch: MatchNavSummary = {
  id: 'prev-1',
  date: '2026-04-26',
  home_team: { id: 3, name: 'Brighton & Hove Albion', short_name: 'Brighton' },
  away_team: { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs' },
};

const nextMatch: MatchNavSummary = {
  id: 'next-1',
  date: '2026-05-16',
  home_team: { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs' },
  away_team: { id: 4, name: 'Manchester United', short_name: 'Man Utd' },
};

describe('MatchNavigation', () => {
  beforeEach(() => {
    pushMock.mockClear();
    mockStartTransition.mockClear();
    mockStartTransition.mockImplementation((callback: () => void) => callback());
    mockIsPending = false;
  });

  it('renders the previous and next match labels', () => {
    render(
      <MatchNavigation
        previousMatch={previousMatch}
        nextMatch={nextMatch}
        currentMatch={baseMatch}
        headerFontSize="text-2xl"
      />
    );

    expect(screen.getAllByText('Brighton vs Spurs').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Spurs vs Man Utd').length).toBeGreaterThan(0);
  });

  it('shows fallback text and disables the buttons when there is no previous/next match', () => {
    render(
      <MatchNavigation
        previousMatch={null}
        nextMatch={null}
        currentMatch={baseMatch}
        headerFontSize="text-2xl"
      />
    );

    const prevButtons = screen.getAllByRole('button', { name: /No Previous Match/i });
    const nextButtons = screen.getAllByRole('button', { name: /No Next Match/i });
    expect(prevButtons.length).toBeGreaterThan(0);
    expect(nextButtons.length).toBeGreaterThan(0);
    prevButtons.forEach((btn) => expect(btn).toBeDisabled());
    nextButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('navigates to the previous match on click', () => {
    render(
      <MatchNavigation
        previousMatch={previousMatch}
        nextMatch={nextMatch}
        currentMatch={baseMatch}
        headerFontSize="text-2xl"
      />
    );

    const [prevButton] = screen.getAllByRole('button', { name: /Brighton vs Spurs/i });
    fireEvent.click(prevButton);

    expect(pushMock).toHaveBeenCalledWith('/spurs-women/matches/prev-1');
  });

  it('navigates to the next match on click', () => {
    render(
      <MatchNavigation
        previousMatch={previousMatch}
        nextMatch={nextMatch}
        currentMatch={baseMatch}
        headerFontSize="text-2xl"
      />
    );

    const [nextButton] = screen.getAllByRole('button', { name: /Spurs vs Man Utd/i });
    fireEvent.click(nextButton);

    expect(pushMock).toHaveBeenCalledWith('/spurs-women/matches/next-1');
  });

  it('does not navigate when the target match is missing', () => {
    render(
      <MatchNavigation
        previousMatch={null}
        nextMatch={nextMatch}
        currentMatch={baseMatch}
        headerFontSize="text-2xl"
      />
    );

    const [prevButton] = screen.getAllByRole('button', { name: /No Previous Match/i });
    fireEvent.click(prevButton);

    expect(pushMock).not.toHaveBeenCalled();
  });

  describe('score display', () => {
    it('shows a plain score for a normal result', () => {
      render(
        <MatchNavigation
          previousMatch={previousMatch}
          nextMatch={nextMatch}
          currentMatch={baseMatch}
          headerFontSize="text-2xl"
        />
      );

      expect(screen.getAllByText('2 - 1').length).toBeGreaterThan(0);
    });

    it('shows AET scores in brackets when present', () => {
      const aetMatch: Match = {
        ...baseMatch,
        spurs_score: 2,
        opponent_score: 2,
        spurs_score_aet: 3,
        opponent_score_aet: 2,
      };

      render(
        <MatchNavigation
          previousMatch={previousMatch}
          nextMatch={nextMatch}
          currentMatch={aetMatch}
          headerFontSize="text-2xl"
        />
      );

      expect(screen.getAllByText('(3) 2 - 2 (2)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('AET').length).toBeGreaterThan(0);
    });

    it('shows penalty scores in brackets, taking priority over AET', () => {
      const pensMatch: Match = {
        ...baseMatch,
        spurs_score: 1,
        opponent_score: 1,
        spurs_score_aet: 1,
        opponent_score_aet: 1,
        spurs_score_pens: 5,
        opponent_score_pens: 4,
      };

      render(
        <MatchNavigation
          previousMatch={previousMatch}
          nextMatch={nextMatch}
          currentMatch={pensMatch}
          headerFontSize="text-2xl"
        />
      );

      expect(screen.getAllByText('(5) 1 - 1 (4)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('PENS').length).toBeGreaterThan(0);
    });
  });

  describe('pending navigation state', () => {
    it('pulses only the clicked button\'s arrow in place, without adding an extra element to the button', () => {
      const { rerender } = render(
        <MatchNavigation
          previousMatch={previousMatch}
          nextMatch={nextMatch}
          currentMatch={baseMatch}
          headerFontSize="text-2xl"
        />
      );

      const [prevButton] = screen.getAllByRole('button', { name: /Brighton vs Spurs/i });
      fireEvent.click(prevButton);

      // Simulate the navigation still being in flight.
      mockIsPending = true;
      rerender(
        <MatchNavigation
          previousMatch={previousMatch}
          nextMatch={nextMatch}
          currentMatch={baseMatch}
          headerFontSize="text-2xl"
        />
      );

      const prevButtons = screen.getAllByRole('button', { name: /Brighton vs Spurs/i });
      const nextButtons = screen.getAllByRole('button', { name: /Spurs vs Man Utd/i });

      // Both buttons are disabled while any navigation is pending.
      [...prevButtons, ...nextButtons].forEach((btn) => expect(btn).toBeDisabled());

      // The clicked (previous) button's arrow gets the pulse class in place,
      // matching its original size classes, and the button itself still has
      // only one child element (no second element stacked in from Button's
      // own `loading` render path, which is what previously grew the button's
      // height).
      expect(prevButtons[0].querySelectorAll('.animate-pulse')).toHaveLength(1);
      expect(prevButtons[0].querySelector('.animate-pulse')).toHaveClass('w-4', 'h-4');
      expect(prevButtons[0].children).toHaveLength(1);

      expect(prevButtons[1].querySelectorAll('.animate-pulse')).toHaveLength(1);
      expect(prevButtons[1].querySelector('.animate-pulse')).toHaveClass('w-3', 'h-3');
      expect(prevButtons[1].children).toHaveLength(1);

      // The next button is unaffected — its arrow isn't pulsing.
      nextButtons.forEach((btn) => {
        expect(btn.querySelector('.animate-pulse')).not.toBeInTheDocument();
        expect(btn.querySelector('svg')).toBeInTheDocument();
        expect(btn.children).toHaveLength(1);
      });
    });
  });
});
