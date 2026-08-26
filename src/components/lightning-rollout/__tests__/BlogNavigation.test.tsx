import { render, screen } from '@testing-library/react';
import { BlogNavigation } from '../BlogNavigation';

describe('BlogNavigation', () => {
  it('renders both links with the given labels and hrefs', () => {
    render(
      <BlogNavigation
        left={{ label: '← Part 1', href: '/lightning-rollout/part-1' }}
        right={{ label: 'Part 3 →', href: '/lightning-rollout/part-3' }}
      />
    );

    expect(screen.getByRole('link', { name: '← Part 1' })).toHaveAttribute('href', '/lightning-rollout/part-1');
    expect(screen.getByRole('link', { name: 'Part 3 →' })).toHaveAttribute('href', '/lightning-rollout/part-3');
  });
});
