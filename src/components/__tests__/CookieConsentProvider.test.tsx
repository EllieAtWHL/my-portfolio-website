import { render, screen, act } from '@testing-library/react';
import CookieConsentProvider, { useCookieConsent } from '../CookieConsentProvider';

function TestConsumer() {
  const { consent, isBannerOpen, accept, reject, openPreferences } = useCookieConsent();
  return (
    <div>
      <span data-testid="consent">{consent ?? 'null'}</span>
      <span data-testid="banner-open">{String(isBannerOpen)}</span>
      <button onClick={accept}>accept</button>
      <button onClick={reject}>reject</button>
      <button onClick={openPreferences}>reopen</button>
    </div>
  );
}

describe('CookieConsentProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    // @ts-expect-error - test double, not a full FullStoryAPI
    window.FS = { consent: jest.fn(), shutdown: jest.fn() };
  });

  it('opens the banner on first visit when no choice is stored', async () => {
    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );

    expect(await screen.findByTestId('banner-open')).toHaveTextContent('true');
    expect(screen.getByTestId('consent')).toHaveTextContent('null');
  });

  it('does not open the banner when a choice was already stored', async () => {
    localStorage.setItem('cookie-consent', JSON.stringify({ status: 'accepted', version: 1 }));

    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );

    expect(await screen.findByTestId('consent')).toHaveTextContent('accepted');
    expect(screen.getByTestId('banner-open')).toHaveTextContent('false');
  });

  it('accept() persists the choice and closes the banner', async () => {
    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );
    await screen.findByTestId('banner-open');

    act(() => {
      screen.getByText('accept').click();
    });

    expect(screen.getByTestId('consent')).toHaveTextContent('accepted');
    expect(screen.getByTestId('banner-open')).toHaveTextContent('false');
    expect(JSON.parse(localStorage.getItem('cookie-consent')!)).toEqual({
      status: 'accepted',
      version: 1,
    });
  });

  it('reject() persists the choice, closes the banner, and shuts FullStory down', async () => {
    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );
    await screen.findByTestId('banner-open');

    act(() => {
      screen.getByText('reject').click();
    });

    expect(screen.getByTestId('consent')).toHaveTextContent('rejected');
    expect(JSON.parse(localStorage.getItem('cookie-consent')!)).toEqual({
      status: 'rejected',
      version: 1,
    });
    expect(window.FS?.consent).toHaveBeenCalledWith(false);
    expect(window.FS?.shutdown).toHaveBeenCalled();
  });

  it('openPreferences() reopens the banner after a choice was already made', async () => {
    localStorage.setItem('cookie-consent', JSON.stringify({ status: 'accepted', version: 1 }));

    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );
    await screen.findByTestId('consent');
    expect(screen.getByTestId('banner-open')).toHaveTextContent('false');

    act(() => {
      screen.getByText('reopen').click();
    });

    expect(screen.getByTestId('banner-open')).toHaveTextContent('true');
  });

  it.each([
    ['a stale version number', JSON.stringify({ status: 'accepted', version: 0 })],
    ['the pre-versioning bare string format', 'accepted'],
    ['malformed JSON', '{not json'],
  ])('treats %s as no stored consent and reopens the banner', async (_label, stored) => {
    localStorage.setItem('cookie-consent', stored);

    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );

    expect(await screen.findByTestId('banner-open')).toHaveTextContent('true');
    expect(screen.getByTestId('consent')).toHaveTextContent('null');
  });

  it('throws when useCookieConsent is used outside the provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useCookieConsent must be used within a CookieConsentProvider'
    );

    spy.mockRestore();
  });
});
