/**
 * @jest-environment-options {"url": "https://ellieatwhl.co.uk/contact-me"}
 */
// Pinning a non-localhost URL via the jsdom environment docblock (matching
// src/lib/__tests__/fullstory.non-localhost.test.ts) exercises the real
// "captcha would load in production" path. The localhost skip path is
// covered separately in page.localhost.test.tsx, since jsdom's window.location
// isn't reassignable at runtime in this jsdom version.
import React from 'react';
import { render, screen } from '@testing-library/react';
import ContactMe from '../page';
import { useCookieConsent } from '@/components/CookieConsentProvider';

jest.mock('@/components/CookieConsentProvider', () => ({
  useCookieConsent: jest.fn(),
}));

jest.mock('@/components/MainSitePage', () => {
  return function MockMainSitePage({ children }: { children: React.ReactNode }) {
    return <div data-testid="main-site-page">{children}</div>;
  };
});

const mockUseCookieConsent = useCookieConsent as jest.Mock;

describe('ContactMe reCAPTCHA consent gating (non-localhost)', () => {
  it('shows a message asking for spam protection consent instead of the captcha when it is not allowed', () => {
    // Every other category allowed - only spam protection should matter here
    mockUseCookieConsent.mockReturnValue({
      hasConsent: (category: string) => category !== 'spamProtection',
    });

    render(<ContactMe />);

    expect(screen.getByText(/allow "spam protection" cookies/i)).toBeInTheDocument();
    expect(document.querySelector('.g-recaptcha')).not.toBeInTheDocument();
  });

  it('excludes every visible form field from FullStory recording', () => {
    mockUseCookieConsent.mockReturnValue({ hasConsent: () => true });

    render(<ContactMe />);

    for (const name of ['first_name', 'last_name', 'email', 'description']) {
      expect(document.querySelector(`[name="${name}"]`)).toHaveClass('fs-exclude');
    }
  });

  it('renders the captcha widget once spam protection is allowed', () => {
    mockUseCookieConsent.mockReturnValue({ hasConsent: (category: string) => category === 'spamProtection' });

    render(<ContactMe />);

    expect(document.querySelector('.g-recaptcha')).toBeInTheDocument();
    expect(screen.queryByText(/spam protection" cookies/i)).not.toBeInTheDocument();
  });
});
