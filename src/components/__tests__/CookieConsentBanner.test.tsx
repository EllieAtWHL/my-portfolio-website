import { render, screen } from '@testing-library/react';
import { CookieConsentBanner } from '../CookieConsentBanner';
import { useCookieConsent } from '../CookieConsentProvider';
import { usePathname } from 'next/navigation';

jest.mock('../CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUseCookieConsent = useCookieConsent as jest.Mock;
const mockUsePathname = usePathname as jest.Mock;

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

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

  it('uses the main-site button styling outside /spurs-women', () => {
    mockUsePathname.mockReturnValue('/contact-me');
    mockUseCookieConsent.mockReturnValue({ isBannerOpen: true, accept: jest.fn(), reject: jest.fn() });

    render(<CookieConsentBanner />);

    const region = screen.getByRole('region', { name: 'Cookie consent' });
    expect(region).not.toHaveClass('spurs-wrapper');
    expect(screen.getByRole('button', { name: 'Accept' })).toHaveClass('primary');
    expect(screen.getByRole('button', { name: 'Reject' })).toHaveClass('secondary');
  });

  it.each(['/spurs-women', '/spurs-women/matches'])(
    'uses the spurs button styling under %s',
    (pathname) => {
      mockUsePathname.mockReturnValue(pathname);
      mockUseCookieConsent.mockReturnValue({ isBannerOpen: true, accept: jest.fn(), reject: jest.fn() });

      render(<CookieConsentBanner />);

      const region = screen.getByRole('region', { name: 'Cookie consent' });
      expect(region).toHaveClass('spurs-wrapper');
      expect(screen.getByRole('button', { name: 'Accept' })).toHaveClass('spurs-button');
      expect(screen.getByRole('button', { name: 'Reject' })).toHaveClass('spurs-button');
    }
  );
});
