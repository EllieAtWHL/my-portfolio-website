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
    mockUseCookieConsent.mockReturnValue({ hasConsent: () => false, isConsentKnown: true, choices: null, saveChoices: jest.fn() });

    render(<ContactMe />);

    expect(document.querySelector('.g-recaptcha')).not.toBeInTheDocument();
    expect(screen.queryByText(/can't send a message without it/)).not.toBeInTheDocument();
    // localhost simulates the submission instead of posting to Salesforce,
    // so Send stays usable without reCAPTCHA there
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeEnabled();
  });

  it('tells visitors that messages sent while the form was broken never arrived', () => {
    mockUseCookieConsent.mockReturnValue({ hasConsent: () => false, isConsentKnown: true, choices: null, saveChoices: jest.fn() });
    const now = jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2027, 1, 11, 23, 59));

    render(<ContactMe />);
    now.mockRestore();

    expect(
      screen.getByRole('heading', { name: 'Did you message me between 5 August and 12 November 2026?' })
    ).toBeInTheDocument();
    expect(screen.getByText(/please send it again/)).toBeInTheDocument();
  });

  it('hides the missed-messages notice from 12 February 2027 (WEB-243 removes it)', () => {
    mockUseCookieConsent.mockReturnValue({ hasConsent: () => false, isConsentKnown: true, choices: null, saveChoices: jest.fn() });
    const now = jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2027, 1, 12));

    render(<ContactMe />);
    now.mockRestore();

    expect(screen.queryByRole('heading', { name: /Did you message me/ })).not.toBeInTheDocument();
  });
});
