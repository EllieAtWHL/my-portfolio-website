import { render, screen, act } from '@testing-library/react';
import CookieConsentProvider, {
  CONSENT_CATEGORIES,
  useCookieConsent,
  type ConsentChoices,
} from '../CookieConsentProvider';

const ALL_ON: ConsentChoices = {
  sessionRecording: true,
  analytics: true,
  spamProtection: true,
  embeds: true,
};
const ALL_OFF: ConsentChoices = {
  sessionRecording: false,
  analytics: false,
  spamProtection: false,
  embeds: false,
};
const ANALYTICS_ONLY: ConsentChoices = { ...ALL_OFF, analytics: true };

function storeChoices(choices: ConsentChoices, version = 4) {
  localStorage.setItem('cookie-consent', JSON.stringify({ choices, version }));
}

function TestConsumer() {
  const {
    choices,
    hasConsent,
    isConsentKnown,
    isBannerOpen,
    acceptAll,
    rejectAll,
    saveChoices,
    openPreferences,
  } = useCookieConsent();
  return (
    <div>
      <span data-testid="choices">{choices ? JSON.stringify(choices) : 'null'}</span>
      {CONSENT_CATEGORIES.map((category) => (
        <span key={category} data-testid={`has-${category}`}>
          {String(hasConsent(category))}
        </span>
      ))}
      <span data-testid="banner-open">{String(isBannerOpen)}</span>
      <span data-testid="consent-known">{String(isConsentKnown)}</span>
      <button onClick={acceptAll}>accept all</button>
      <button onClick={rejectAll}>reject all</button>
      <button onClick={() => saveChoices(ANALYTICS_ONLY)}>save analytics only</button>
      <button onClick={openPreferences}>reopen</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <CookieConsentProvider>
      <TestConsumer />
    </CookieConsentProvider>
  );
}

function click(name: string) {
  act(() => {
    screen.getByText(name).click();
  });
}

function storedValue() {
  return JSON.parse(localStorage.getItem('cookie-consent')!);
}

describe('CookieConsentProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    // @ts-expect-error - test double, not a full FullStoryAPI
    window.FS = { consent: jest.fn(), shutdown: jest.fn() };
  });

  it('opens the banner on first visit when no choice is stored', async () => {
    renderProvider();

    expect(await screen.findByTestId('banner-open')).toHaveTextContent('true');
    expect(screen.getByTestId('choices')).toHaveTextContent('null');
    for (const category of CONSENT_CATEGORIES) {
      expect(screen.getByTestId(`has-${category}`)).toHaveTextContent('false');
    }
    // Known, even though no choice was made - distinguishes "no choice" from "not read yet"
    expect(screen.getByTestId('consent-known')).toHaveTextContent('true');
  });

  it('restores stored per-category choices without opening the banner', async () => {
    storeChoices(ANALYTICS_ONLY);

    renderProvider();

    expect(await screen.findByTestId('has-analytics')).toHaveTextContent('true');
    expect(screen.getByTestId('has-sessionRecording')).toHaveTextContent('false');
    expect(screen.getByTestId('has-spamProtection')).toHaveTextContent('false');
    expect(screen.getByTestId('has-embeds')).toHaveTextContent('false');
    expect(screen.getByTestId('banner-open')).toHaveTextContent('false');
  });

  it('acceptAll() allows every category, persists it and closes the banner', async () => {
    renderProvider();
    await screen.findByTestId('banner-open');

    click('accept all');

    for (const category of CONSENT_CATEGORIES) {
      expect(screen.getByTestId(`has-${category}`)).toHaveTextContent('true');
    }
    expect(screen.getByTestId('banner-open')).toHaveTextContent('false');
    expect(storedValue()).toEqual({ choices: ALL_ON, version: 4 });
    expect(window.FS?.shutdown).not.toHaveBeenCalled();
  });

  it('rejectAll() declines every category, persists it and shuts FullStory down', async () => {
    renderProvider();
    await screen.findByTestId('banner-open');

    click('reject all');

    for (const category of CONSENT_CATEGORIES) {
      expect(screen.getByTestId(`has-${category}`)).toHaveTextContent('false');
    }
    expect(screen.getByTestId('banner-open')).toHaveTextContent('false');
    expect(storedValue()).toEqual({ choices: ALL_OFF, version: 4 });
    expect(window.FS?.consent).toHaveBeenCalledWith(false);
    expect(window.FS?.shutdown).toHaveBeenCalled();
  });

  it('saveChoices() persists a mixed choice and shuts FullStory down when session recording is off', async () => {
    storeChoices(ALL_ON);
    renderProvider();
    await screen.findByTestId('choices');

    click('save analytics only');

    expect(screen.getByTestId('has-analytics')).toHaveTextContent('true');
    expect(screen.getByTestId('has-sessionRecording')).toHaveTextContent('false');
    expect(storedValue()).toEqual({ choices: ANALYTICS_ONLY, version: 4 });
    expect(window.FS?.consent).toHaveBeenCalledWith(false);
    expect(window.FS?.shutdown).toHaveBeenCalled();
  });

  it('openPreferences() reopens the banner after a choice was already made', async () => {
    storeChoices(ALL_ON);
    renderProvider();
    await screen.findByTestId('choices');
    expect(screen.getByTestId('banner-open')).toHaveTextContent('false');

    click('reopen');

    expect(screen.getByTestId('banner-open')).toHaveTextContent('true');
    // Reopening doesn't clear the existing choice
    expect(screen.getByTestId('has-analytics')).toHaveTextContent('true');
  });

  it('syncs a choice made in another tab, stopping FullStory if session recording was turned off there', async () => {
    storeChoices(ALL_ON);
    renderProvider();
    await screen.findByTestId('choices');

    act(() => {
      storeChoices(ANALYTICS_ONLY);
      window.dispatchEvent(new StorageEvent('storage', { key: 'cookie-consent' }));
    });

    expect(screen.getByTestId('has-sessionRecording')).toHaveTextContent('false');
    expect(screen.getByTestId('has-analytics')).toHaveTextContent('true');
    expect(window.FS?.shutdown).toHaveBeenCalled();
  });

  it.each([
    ['a stale version number', JSON.stringify({ choices: ALL_ON, version: 0 })],
    [
      'consent stored under the pre-Speed-Insights version (WEB-64)',
      JSON.stringify({ status: 'accepted', version: 1 }),
    ],
    [
      'consent stored before Instagram embeds were gated (WEB-147)',
      JSON.stringify({ status: 'accepted', version: 2 }),
    ],
    [
      'the single accept/reject choice from before per-category consent (WEB-104)',
      JSON.stringify({ status: 'accepted', version: 3 }),
    ],
    [
      'a current-version value missing a category',
      JSON.stringify({ choices: { sessionRecording: true, analytics: true }, version: 4 }),
    ],
    [
      'a current-version value with a non-boolean choice',
      JSON.stringify({ choices: { ...ALL_ON, analytics: 'yes' }, version: 4 }),
    ],
    ['the pre-versioning bare string format', 'accepted'],
    ['malformed JSON', '{not json'],
  ])('treats %s as no stored consent and reopens the banner', async (_label, stored) => {
    localStorage.setItem('cookie-consent', stored);

    renderProvider();

    expect(await screen.findByTestId('banner-open')).toHaveTextContent('true');
    expect(screen.getByTestId('choices')).toHaveTextContent('null');
  });

  it('throws when useCookieConsent is used outside the provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useCookieConsent must be used within a CookieConsentProvider'
    );

    spy.mockRestore();
  });
});
