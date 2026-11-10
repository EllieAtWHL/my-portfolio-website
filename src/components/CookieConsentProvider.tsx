'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// One category per distinct purpose, rather than per tracker or one bundled
// toggle (WEB-104): session recording is far more invasive than the
// cookieless page-count analytics, and neither has anything to do with the
// contact form's spam protection or third-party embeds.
export const CONSENT_CATEGORIES = ['sessionRecording', 'analytics', 'spamProtection', 'embeds'] as const;

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];
export type ConsentChoices = Record<ConsentCategory, boolean>;

const STORAGE_KEY = 'cookie-consent';
// Bump this when what a category covers changes (e.g. a new tracker is
// added to one) or the stored shape changes - stored consent from an older
// version is treated as no consent at all, so visitors who already chose
// under the old meaning are re-prompted rather than silently carrying a
// choice that no longer reflects what they agreed to. 4 = per-category
// choices (WEB-104), replacing the single accepted/rejected status.
const CONSENT_VERSION = 4;

interface StoredConsent {
  choices: ConsentChoices;
  version: number;
}

export function allChoices(value: boolean): ConsentChoices {
  return Object.fromEntries(CONSENT_CATEGORIES.map((category) => [category, value])) as ConsentChoices;
}

interface CookieConsentContextType {
  // null = no choice made yet (or not read yet - see isConsentKnown)
  choices: ConsentChoices | null;
  hasConsent: (category: ConsentCategory) => boolean;
  // False until the stored choice has been read on the client - choices is
  // null both before that and when no choice has been made, and UI that
  // tells the visitor to allow cookies shouldn't flash for one who already has.
  isConsentKnown: boolean;
  isBannerOpen: boolean;
  // True only when openPreferences() opened the banner - see the provider.
  shouldFocusBanner: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  saveChoices: (choices: ConsentChoices) => void;
  openPreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}

function getStoredChoices(): ConsentChoices | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (parsed.version !== CONSENT_VERSION || !parsed.choices) return null;

    const stored = parsed.choices;
    if (!CONSENT_CATEGORIES.every((category) => typeof stored[category] === 'boolean')) return null;

    // Rebuilt from the known categories so stray keys don't leak through.
    return Object.fromEntries(
      CONSENT_CATEGORIES.map((category) => [category, stored[category]])
    ) as ConsentChoices;
  } catch {
    // Covers both real storage errors and pre-versioning values (a bare
    // "accepted"/"rejected" string isn't valid JSON) - either way, treat it
    // as no stored consent.
    return null;
  }
}

function setStoredChoices(choices: ConsentChoices) {
  try {
    const value: StoredConsent = { choices, version: CONSENT_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore localStorage errors (e.g. private browsing)
  }
}

// FullStory is only loaded once (FullStoryLoader's <Script> doesn't re-run
// an already-loaded src), so turning session recording off and on again in
// one page session has to go through its runtime API. Stopping is
// best-effort: it can't undo anything already captured before the call.
// The other categories have no runtime "stop" API - their gated components
// just stop rendering.
function applySessionRecording(choices: ConsentChoices | null, stopped: { current: boolean }) {
  if (!choices || typeof window === 'undefined' || !window.FS) return;

  if (!choices.sessionRecording && !stopped.current) {
    window.FS.consent(false);
    window.FS.shutdown();
    stopped.current = true;
  } else if (choices.sessionRecording && stopped.current) {
    window.FS.consent(true);
    window.FS.restart();
    stopped.current = false;
  }
}

interface CookieConsentProviderProps {
  children: React.ReactNode;
}

export default function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [choices, setChoices] = useState<ConsentChoices | null>(null);
  const [isConsentKnown, setIsConsentKnown] = useState(false);
  // Starts closed so the server render and first client render match; the
  // effect below opens it once we know (client-only) that no choice is stored.
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  // True when the banner was opened on purpose ("Cookie preferences"), so it
  // should take focus - not when it opens by itself on a first visit.
  const [shouldFocusBanner, setShouldFocusBanner] = useState(false);
  const fullStoryStopped = useRef(false);
  const hasStoredChoice = useRef(false);

  useEffect(() => {
    function sync({ fromOtherTab }: { fromOtherTab: boolean }) {
      const stored = getStoredChoices();
      setChoices(stored);
      setIsConsentKnown(true);
      setShouldFocusBanner(false);
      // A choice made in another tab closes this tab's first-visit prompt
      // (accepting in one tab shouldn't leave another tab asking). But a
      // banner this visitor reopened here to edit stays open, so their
      // unsaved ticks aren't thrown away mid-edit.
      const hadChoice = hasStoredChoice.current;
      setIsBannerOpen((open) =>
        stored === null ? true : fromOtherTab && open && hadChoice ? open : false
      );
      hasStoredChoice.current = stored !== null;
      applySessionRecording(stored, fullStoryStopped);
    }

    sync({ fromOtherTab: false });

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        sync({ fromOtherTab: true });
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const saveChoices = useCallback((next: ConsentChoices) => {
    setStoredChoices(next);
    setChoices(next);
    setIsBannerOpen(false);
    setShouldFocusBanner(false);
    hasStoredChoice.current = true;
    applySessionRecording(next, fullStoryStopped);
  }, []);

  const acceptAll = useCallback(() => saveChoices(allChoices(true)), [saveChoices]);
  const rejectAll = useCallback(() => saveChoices(allChoices(false)), [saveChoices]);

  const hasConsent = useCallback(
    (category: ConsentCategory) => choices?.[category] === true,
    [choices]
  );

  const openPreferences = useCallback(() => {
    setIsBannerOpen(true);
    setShouldFocusBanner(true);
  }, []);

  return (
    <CookieConsentContext.Provider
      value={{
        choices,
        hasConsent,
        isConsentKnown,
        isBannerOpen,
        shouldFocusBanner,
        acceptAll,
        rejectAll,
        saveChoices,
        openPreferences,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}
