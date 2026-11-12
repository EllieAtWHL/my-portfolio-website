import { render, screen, fireEvent } from '@testing-library/react';
import { CookieConsentBanner } from '../CookieConsentBanner';
import { CONSENT_CATEGORIES, useCookieConsent, type ConsentChoices } from '../CookieConsentProvider';
import { usePathname } from 'next/navigation';

jest.mock('../CookieConsentProvider', () => ({
  ...jest.requireActual('../CookieConsentProvider'),
  useCookieConsent: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUseCookieConsent = useCookieConsent as jest.Mock;
const mockUsePathname = usePathname as jest.Mock;

function mockConsent(overrides: Partial<ReturnType<typeof useCookieConsent>> = {}) {
  const value = {
    choices: null,
    isBannerOpen: true,
    shouldFocusBanner: false,
    acceptAll: jest.fn(),
    rejectAll: jest.fn(),
    saveChoices: jest.fn(),
    ...overrides,
  };
  mockUseCookieConsent.mockReturnValue(value);
  return value;
}

const CATEGORY_LABELS = ['Session recording', 'Analytics', 'Spam protection', 'Embedded content'];

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  it('renders nothing when the banner is closed', () => {
    mockConsent({ isBannerOpen: false });

    render(<CookieConsentBanner />);

    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
  });

  it('on first visit shows Reject all / Manage choices / Accept all without the category list', () => {
    const { acceptAll, rejectAll } = mockConsent();

    render(<CookieConsentBanner />);

    expect(screen.getByRole('region', { name: 'Cookie consent' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Accept all' }));
    expect(acceptAll).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Reject all' }));
    expect(rejectAll).toHaveBeenCalled();
  });

  it('Manage choices reveals one unticked checkbox per category, and Save choices saves the ticked ones', () => {
    const { saveChoices } = mockConsent();

    render(<CookieConsentBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Manage choices' }));

    expect(screen.getAllByRole('checkbox')).toHaveLength(CONSENT_CATEGORIES.length);
    for (const label of CATEGORY_LABELS) {
      expect(screen.getByRole('checkbox', { name: label })).not.toBeChecked();
    }
    // Reject all / Accept all stay available alongside the detailed view
    expect(screen.getByRole('button', { name: 'Reject all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept all' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Analytics' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Spam protection' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save choices' }));

    expect(saveChoices).toHaveBeenCalledWith({
      sessionRecording: false,
      analytics: true,
      spamProtection: true,
      embeds: false,
    });
  });

  it('gives each checkbox its description as an accessible description', () => {
    mockConsent();

    render(<CookieConsentBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Manage choices' }));

    expect(screen.getByRole('checkbox', { name: 'Session recording' })).toHaveAccessibleDescription(
      /FullStory/
    );
  });

  it('reopened with an existing choice, goes straight to the category list pre-filled with it', () => {
    const choices: ConsentChoices = {
      sessionRecording: false,
      analytics: true,
      spamProtection: false,
      embeds: true,
    };
    const { saveChoices } = mockConsent({ choices });

    render(<CookieConsentBanner />);

    expect(screen.queryByRole('button', { name: 'Manage choices' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Session recording' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Analytics' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Spam protection' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Embedded content' })).toBeChecked();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Embedded content' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save choices' }));

    expect(saveChoices).toHaveBeenCalledWith({ ...choices, embeds: false });
  });

  it('moves focus into the banner when it was opened via Cookie preferences', () => {
    mockConsent({ shouldFocusBanner: true });

    render(<CookieConsentBanner />);

    expect(screen.getByRole('region', { name: 'Cookie consent' })).toHaveFocus();
  });

  it('leaves focus alone when the banner opens by itself on a first visit', () => {
    mockConsent({ shouldFocusBanner: false });

    render(<CookieConsentBanner />);

    expect(screen.getByRole('region', { name: 'Cookie consent' })).not.toHaveFocus();
  });

  it('keeps the checkbox list out of the live region', () => {
    mockConsent({ choices: { sessionRecording: false, analytics: false, spamProtection: false, embeds: false } });

    render(<CookieConsentBanner />);

    expect(screen.getByRole('region', { name: 'Cookie consent' })).not.toHaveAttribute('aria-live');
    expect(screen.getByRole('group').closest('[aria-live]')).toBeNull();
    expect(screen.getByText(/This site uses optional cookies/)).toHaveAttribute('aria-live', 'polite');
  });

  it('publishes its height as --cookie-banner-height while open, and removes it when closed', () => {
    mockConsent();
    const { rerender } = render(<CookieConsentBanner />);

    // jsdom has no layout, so offsetHeight is 0 - what matters is that the
    // variable is set while open (globals.css adds it to footer clearance)
    expect(document.documentElement.style.getPropertyValue('--cookie-banner-height')).toBe('0px');

    mockConsent({ isBannerOpen: false });
    rerender(<CookieConsentBanner />);

    expect(document.documentElement.style.getPropertyValue('--cookie-banner-height')).toBe('');
  });

    it('links to the privacy policy from the summary', () => {
    mockConsent();

    render(<CookieConsentBanner />);

    expect(screen.getByRole('link', { name: 'privacy policy' })).toHaveAttribute('href', '/privacy-policy');
  });

  it('uses the main-site button styling outside /spurs-women', () => {
    mockUsePathname.mockReturnValue('/contact-me');
    mockConsent();

    render(<CookieConsentBanner />);

    const region = screen.getByRole('region', { name: 'Cookie consent' });
    expect(region).not.toHaveClass('spurs-wrapper');
    expect(screen.getByRole('button', { name: 'Accept all' })).toHaveClass('primary');
    expect(screen.getByRole('button', { name: 'Reject all' })).toHaveClass('secondary');
    expect(screen.getByRole('button', { name: 'Manage choices' })).toHaveClass('secondary');
  });

  it.each(['/spurs-women', '/spurs-women/matches'])(
    'uses the spurs button styling under %s',
    (pathname) => {
      mockUsePathname.mockReturnValue(pathname);
      mockConsent();

      render(<CookieConsentBanner />);

      const region = screen.getByRole('region', { name: 'Cookie consent' });
      expect(region).toHaveClass('spurs-wrapper');
      for (const name of ['Accept all', 'Reject all', 'Manage choices']) {
        expect(screen.getByRole('button', { name })).toHaveClass('spurs-button');
      }
    }
  );
});
