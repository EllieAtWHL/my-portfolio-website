// jest-environment-jsdom defaults to http://localhost/, so no docblock override
// is needed here - see page.test.tsx for the non-localhost gating tests.
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

describe('ContactMe reCAPTCHA consent gating (localhost)', () => {
  it('skips both the captcha and the consent message on localhost regardless of consent', () => {
    mockUseCookieConsent.mockReturnValue({ consent: null });

    render(<ContactMe />);

    expect(document.querySelector('.g-recaptcha')).not.toBeInTheDocument();
    expect(screen.queryByText(/accept cookies/i)).not.toBeInTheDocument();
  });
});
