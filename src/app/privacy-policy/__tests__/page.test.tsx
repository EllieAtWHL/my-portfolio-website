import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PrivacyPolicyPage from '../page';
import { useCookieConsent } from '@/components/CookieConsentProvider';
import { CONSENT_CATEGORIES } from '@/components/CookieConsentProvider';

jest.mock('@/components/CookieConsentProvider', () => ({
  ...jest.requireActual('@/components/CookieConsentProvider'),
  useCookieConsent: jest.fn(),
}));

jest.mock('@/components/MainSitePage', () => {
  return function MockMainSitePage({ children }: { children: React.ReactNode }) {
    return <div data-testid="main-site-page">{children}</div>;
  };
});

const mockUseCookieConsent = useCookieConsent as jest.Mock;

describe('Privacy policy page', () => {
  beforeEach(() => {
    mockUseCookieConsent.mockReturnValue({ openPreferences: jest.fn() });
  });

  it('renders the title and a last-updated date', () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByText(/Last updated \d{1,2} \w+ \d{4}/)).toBeInTheDocument();
  });

  it('describes every cookie consent category, so the policy stays in step with the banner', () => {
    // If a category is added to CONSENT_CATEGORIES, this fails until the
    // policy gets a matching section.
    const headings: Record<(typeof CONSENT_CATEGORIES)[number], RegExp> = {
      sessionRecording: /^Session recording/,
      analytics: /^Analytics/,
      spamProtection: /^Spam protection/,
      embeds: /^Embedded content/,
    };

    render(<PrivacyPolicyPage />);

    for (const category of CONSENT_CATEGORIES) {
      expect(screen.getByRole('heading', { level: 3, name: headings[category] })).toBeInTheDocument();
    }
  });

  it('reopens the cookie banner from the page', () => {
    const openPreferences = jest.fn();
    mockUseCookieConsent.mockReturnValue({ openPreferences });

    render(<PrivacyPolicyPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Cookie preferences' }));

    expect(openPreferences).toHaveBeenCalled();
  });

  it('points privacy requests at the contact form and complaints at the ICO', () => {
    render(<PrivacyPolicyPage />);

    const contactLinks = screen.getAllByRole('link', { name: 'contact form' });
    expect(contactLinks.length).toBeGreaterThan(0);
    contactLinks.forEach((link) => expect(link).toHaveAttribute('href', '/contact-me'));
    expect(screen.getByRole('link', { name: 'ico.org.uk/make-a-complaint' })).toHaveAttribute(
      'href',
      'https://ico.org.uk/make-a-complaint/'
    );
  });

  it('keeps the spaces after bold labels and inline links', () => {
    // Written as plain "</strong> The...", these spaces were missing from the
    // HTML the dev server actually sent (checked with curl during WEB-103;
    // cause not pinned down), so the page uses explicit {' '} instead.
    const { container } = render(<PrivacyPolicyPage />);
    const text = container.textContent ?? '';

    expect(text).toContain('Hosting. The site');
    expect(text).toContain('Spurs Women data. The match');
    expect(text).toContain('The sign-in page. There');
    expect(text).toContain('contact form and say');
  });

  it('opens third-party policy links in a new tab without leaking the opener', () => {
    render(<PrivacyPolicyPage />);

    const external = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('https://'));
    expect(external.length).toBeGreaterThanOrEqual(8);
    external.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
