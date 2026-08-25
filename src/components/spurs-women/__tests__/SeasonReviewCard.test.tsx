import { render, screen } from '@testing-library/react';
import SeasonReviewCard from '../SeasonReviewCard';

// react-markdown ships ESM-only and has never been exercised by this suite before
// (no prior test imported a component using it) - mock it rather than teach Jest's
// CJS transform about its whole ESM dependency chain (unified, micromark, etc.).
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <>{children}</>;
  };
});

describe('SeasonReviewCard', () => {
  it('renders nothing when there is no review', () => {
    const { container } = render(<SeasonReviewCard review={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the review content and highlights', () => {
    render(
      <SeasonReviewCard
        review={{
          season_id: 1,
          title: 'Season Review',
          content: 'A great season overall.',
          highlights: ['Won the cup', 'Unbeaten at home'],
        }}
      />
    );

    expect(screen.getByText('A great season overall.')).toBeInTheDocument();
    expect(screen.getByText('Won the cup')).toBeInTheDocument();
    expect(screen.getByText('Unbeaten at home')).toBeInTheDocument();
  });

  it('formats the last-updated date consistently regardless of runtime locale', () => {
    render(
      <SeasonReviewCard
        review={{
          season_id: 1,
          title: 'Season Review',
          content: 'Review body.',
          updated_at: '2026-03-05T00:00:00.000Z',
        }}
      />
    );

    expect(screen.getByText('Last updated: 05/03/2026')).toBeInTheDocument();
  });

  it('omits the last-updated line when there is no updated_at', () => {
    render(
      <SeasonReviewCard
        review={{
          season_id: 1,
          title: 'Season Review',
          content: 'Review body.',
        }}
      />
    );

    expect(screen.queryByText(/Last updated/)).not.toBeInTheDocument();
  });
});
