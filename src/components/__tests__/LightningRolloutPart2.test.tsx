import { render, screen } from '@testing-library/react';
import LightningRolloutPart2 from '../LightningRolloutPart2';

describe('LightningRolloutPart2', () => {
  it('renders the title, Medium attribution, and nav links', () => {
    render(<LightningRolloutPart2 />);

    expect(screen.getByRole('heading', { name: /Running the Migration Project/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Medium' })).toHaveAttribute(
      'href',
      'https://medium.com/@eleanormatthewman/salesforce-lightning-rollout-4db412e6682f'
    );
    expect(screen.getByText(/May 2020/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Part 1' })).toHaveAttribute('href', '/lightning-rollout/part-1');
    expect(screen.getByRole('link', { name: 'Part 3 →' })).toHaveAttribute('href', '/lightning-rollout/part-3');
  });

  it('renders distinctive sections from its content', () => {
    render(<LightningRolloutPart2 />);
    expect(screen.getByRole('heading', { name: 'Roll Out Phase' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Change Management' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Technical Implementation' })).toBeInTheDocument();
  });
});
