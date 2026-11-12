/**
 * @jest-environment-options {"url": "https://ellieatwhl.co.uk/contact-me"}
 */
// Pinning a non-localhost URL via the jsdom environment docblock (matching
// src/lib/__tests__/fullstory.non-localhost.test.ts) exercises the real
// "captcha would load in production" path. The localhost skip path is
// covered separately in page.localhost.test.tsx, since jsdom's window.location
// isn't reassignable at runtime in this jsdom version.
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ContactMe from '../page';
import { useCookieConsent } from '@/components/CookieConsentProvider';

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

describe('ContactMe reCAPTCHA consent gating (non-localhost)', () => {
  // Salesforce Web-to-Lead requires reCAPTCHA verification and silently
  // discards submissions without it (WEB-242), so outside localhost the form
  // must never submit unless reCAPTCHA is both allowed and completed.
  let submitSpy: jest.SpyInstance;

  beforeEach(() => {
    submitSpy = jest.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
  });

  afterEach(() => {
    submitSpy.mockRestore();
  });

  function mockConsent(overrides: Record<string, unknown> = {}) {
    const value = {
      hasConsent: (category: string) => category !== 'spamProtection',
      isConsentKnown: true,
      choices: { sessionRecording: true, analytics: true, spamProtection: false, embeds: true },
      saveChoices: jest.fn(),
      ...overrides,
    };
    mockUseCookieConsent.mockReturnValue(value);
    return value;
  }

  function fillForm() {
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Lovelace' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello' } });
  }

  it('disables Send and explains why when spam protection is not allowed', () => {
    mockConsent();

    render(<ContactMe />);

    expect(document.querySelector('.g-recaptcha')).not.toBeInTheDocument();
    expect(screen.getByText(/can't send a message without it/)).toBeInTheDocument();
    const send = screen.getByRole('button', { name: 'Send Message' });
    expect(send).toBeDisabled();
    expect(send).toHaveAttribute('aria-describedby', 'spam-protection-needed');
  });

  it('never submits to Salesforce without spam protection, even via Enter', () => {
    mockConsent();

    render(<ContactMe />);
    fillForm();
    fireEvent.submit(screen.getByRole('button', { name: 'Send Message' }).closest('form')!);

    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('"Allow spam protection" turns on only that category, keeping the other choices', () => {
    const { saveChoices } = mockConsent();

    render(<ContactMe />);
    fireEvent.click(screen.getByRole('button', { name: 'Allow spam protection' }));

    expect(saveChoices).toHaveBeenCalledWith({
      sessionRecording: true,
      analytics: true,
      spamProtection: true,
      embeds: true,
    });
  });

  it('"Allow spam protection" leaves everything else off for a visitor who has not answered the banner', () => {
    const { saveChoices } = mockConsent({ hasConsent: () => false, choices: null });

    render(<ContactMe />);
    fireEvent.click(screen.getByRole('button', { name: 'Allow spam protection' }));

    expect(saveChoices).toHaveBeenCalledWith({
      sessionRecording: false,
      analytics: false,
      spamProtection: true,
      embeds: false,
    });
  });

  it('keeps Send disabled and shows neither state until the stored choice is known', () => {
    mockConsent({ hasConsent: () => false, isConsentKnown: false, choices: null });

    render(<ContactMe />);

    expect(screen.queryByText(/can't send a message without it/)).not.toBeInTheDocument();
    expect(document.querySelector('.g-recaptcha')).not.toBeInTheDocument();
    const send = screen.getByRole('button', { name: 'Send Message' });
    expect(send).toBeDisabled();
    // No description to point at yet
    expect(send).not.toHaveAttribute('aria-describedby');
  });

  it('sends Salesforce an absolute return URL on this site', () => {
    mockConsent();

    render(<ContactMe />);

    expect(document.querySelector('input[name="retURL"]')).toHaveValue(
      'https://ellieatwhl.co.uk/contact-me/thank-you'
    );
  });

  it('renders the captcha widget and enables Send once spam protection is allowed', () => {
    mockConsent({ hasConsent: (category: string) => category === 'spamProtection' });

    render(<ContactMe />);

    expect(document.querySelector('.g-recaptcha')).toBeInTheDocument();
    expect(screen.queryByText(/can't send a message without it/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeEnabled();
  });

  it('blocks the submit with an error if "I\'m not a robot" has not been ticked', () => {
    mockConsent({ hasConsent: (category: string) => category === 'spamProtection' });

    render(<ContactMe />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/I'm not a robot/);
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('clears the "not a robot" error as soon as the visitor completes reCAPTCHA', () => {
    mockConsent({ hasConsent: (category: string) => category === 'spamProtection' });

    render(<ContactMe />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // reCAPTCHA calls the widget's data-callback by name on success
    expect(document.querySelector('.g-recaptcha')).toHaveAttribute('data-callback', 'onContactRecaptchaSuccess');
    act(() => window.onContactRecaptchaSuccess?.());

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('frees Send again when the page is restored from the back/forward cache', async () => {
    mockConsent({ hasConsent: (category: string) => category === 'spamProtection' });

    render(<ContactMe />);
    const response = document.createElement('textarea');
    response.name = 'g-recaptcha-response';
    response.value = 'token-from-google';
    document.querySelector('.g-recaptcha')!.appendChild(response);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled());

    const restored = new Event('pageshow') as PageTransitionEvent;
    Object.defineProperty(restored, 'persisted', { value: true });
    act(() => {
      window.dispatchEvent(restored);
    });

    expect(screen.getByRole('button', { name: 'Send Message' })).toBeEnabled();
  });

  it('submits to Salesforce once reCAPTCHA has been completed', async () => {
    mockConsent({ hasConsent: (category: string) => category === 'spamProtection' });

    render(<ContactMe />);
    fillForm();
    // Stand-in for the hidden response field Google's widget injects
    const response = document.createElement('textarea');
    response.name = 'g-recaptcha-response';
    response.value = 'token-from-google';
    document.querySelector('.g-recaptcha')!.appendChild(response);

    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));

    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
