import { render, screen } from '@testing-library/react';
import { CookieConsentBanner } from '../CookieConsentBanner';
import { useCookieConsent } from '../CookieConsentProvider';

jest.mock('../CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}));

const mockUseCookieConsent = useCookieConsent as jest.Mock;

describe('CookieConsentBanner', () => {
  it('renders nothing when the banner is closed', () => {
    mockUseCookieConsent.mockReturnValue({
      isBannerOpen: false,
      accept: jest.fn(),
      reject: jest.fn(),
    });

    render(<CookieConsentBanner />);

    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
  });

  it('renders Accept/Reject controls when the banner is open', () => {
    const accept = jest.fn();
    const reject = jest.fn();
    mockUseCookieConsent.mockReturnValue({ isBannerOpen: true, accept, reject });

    render(<CookieConsentBanner />);

    expect(screen.getByRole('region', { name: 'Cookie consent' })).toBeInTheDocument();

    screen.getByRole('button', { name: 'Accept' }).click();
    expect(accept).toHaveBeenCalled();

    screen.getByRole('button', { name: 'Reject' }).click();
    expect(reject).toHaveBeenCalled();
  });
});
