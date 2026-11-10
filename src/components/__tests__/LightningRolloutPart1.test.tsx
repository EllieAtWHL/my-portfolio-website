import { render, screen } from '@testing-library/react';
import LightningRolloutPart1 from '../LightningRolloutPart1';
import CookieConsentProvider from '../CookieConsentProvider';

// The page's YouTube embeds are consent-gated (WEB-104), so it needs the
// provider - with nothing stored, each renders its fallback link.
const renderPage = () =>
  render(
    <CookieConsentProvider>
      <LightningRolloutPart1 />
    </CookieConsentProvider>
  );

describe('LightningRolloutPart1', () => {
  it('renders the title, Medium attribution, and nav links', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /How To Persuade Your Business To Let Lightning Strike/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Medium' })).toHaveAttribute(
      'href',
      'https://medium.com/@eleanormatthewman/salesforce-lightning-rollout-dbe57d8d3670'
    );
    expect(screen.getByText(/April 2020/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Back to Series' })).toHaveAttribute('href', '/salesforce/lightning-rollout');
    expect(screen.getByRole('link', { name: 'Next: Part 2 →' })).toHaveAttribute('href', '/salesforce/lightning-rollout/part-2');
  });

  it('renders a distinctive section from its content', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Discovery Phase' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lightning Readiness Report' })).toBeInTheDocument();
  });
});
