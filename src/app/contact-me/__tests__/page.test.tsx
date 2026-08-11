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
  it('shows a message asking for cookie consent instead of the captcha when not accepted', () => {
    mockUseCookieConsent.mockReturnValue({ consent: 'rejected' });

    render(<ContactMe />);

    expect(screen.getByText(/accept cookies/i)).toBeInTheDocument();
    expect(document.querySelector('.g-recaptcha')).not.toBeInTheDocument();
  });

  it('renders the captcha widget once cookies are accepted', () => {
    mockUseCookieConsent.mockReturnValue({ consent: 'accepted' });

    render(<ContactMe />);

    expect(document.querySelector('.g-recaptcha')).toBeInTheDocument();
    expect(screen.queryByText(/accept cookies/i)).not.toBeInTheDocument();
  });
});
