import { render, screen } from '@testing-library/react';
import LightningRolloutPart3 from '../LightningRolloutPart3';

describe('LightningRolloutPart3', () => {
  it('renders the title and nav links, with no Medium attribution', () => {
    render(<LightningRolloutPart3 />);

    expect(screen.getByRole('heading', { name: /We've Migrated to Lightning, Now What\?/ })).toBeInTheDocument();
    expect(screen.queryByText(/Originally posted on/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Part 2' })).toHaveAttribute('href', '/lightning-rollout/part-2');
    expect(screen.getByRole('link', { name: '← Back to Series' })).toHaveAttribute('href', '/lightning-rollout');
  });

  it('renders distinctive sections from its content', () => {
    render(<LightningRolloutPart3 />);
    expect(screen.getByRole('heading', { name: 'Post-Migration Phase' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Conclusion' })).toBeInTheDocument();
  });
});
