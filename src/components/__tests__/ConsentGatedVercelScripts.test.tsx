import { render, screen } from '@testing-library/react';
import { ConsentGatedVercelScripts } from '../ConsentGatedVercelScripts';
import { useCookieConsent } from '../CookieConsentProvider';

jest.mock('../CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}));

jest.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));

jest.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => <div data-testid="vercel-speed-insights" />,
}));

const mockUseCookieConsent = useCookieConsent as jest.Mock;

describe('ConsentGatedVercelScripts', () => {
  it.each([
    ['nothing is allowed', () => false],
    ['every other category is allowed', (category: string) => category !== 'analytics'],
  ])('renders nothing when %s', (_label, hasConsent) => {
    mockUseCookieConsent.mockReturnValue({ hasConsent });

    render(<ConsentGatedVercelScripts />);

    expect(screen.queryByTestId('vercel-analytics')).not.toBeInTheDocument();
    expect(screen.queryByTestId('vercel-speed-insights')).not.toBeInTheDocument();
  });

  it('renders Analytics and SpeedInsights once analytics is allowed', () => {
    mockUseCookieConsent.mockReturnValue({ hasConsent: (category: string) => category === 'analytics' });

    render(<ConsentGatedVercelScripts />);

    expect(screen.getByTestId('vercel-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('vercel-speed-insights')).toBeInTheDocument();
  });
});
