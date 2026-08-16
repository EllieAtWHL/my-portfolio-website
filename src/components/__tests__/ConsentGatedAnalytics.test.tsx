import { render, screen } from '@testing-library/react';
import { ConsentGatedAnalytics } from '../ConsentGatedAnalytics';
import { useCookieConsent } from '../CookieConsentProvider';

jest.mock('../CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}));

jest.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));

const mockUseCookieConsent = useCookieConsent as jest.Mock;

describe('ConsentGatedAnalytics', () => {
  it.each(['rejected', null] as const)('renders nothing when consent is %s', (consent) => {
    mockUseCookieConsent.mockReturnValue({ consent });

    render(<ConsentGatedAnalytics />);

    expect(screen.queryByTestId('vercel-analytics')).not.toBeInTheDocument();
  });

  it('renders Analytics once consent is accepted', () => {
    mockUseCookieConsent.mockReturnValue({ consent: 'accepted' });

    render(<ConsentGatedAnalytics />);

    expect(screen.getByTestId('vercel-analytics')).toBeInTheDocument();
  });
});
