'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ConsentStatus = 'accepted' | 'rejected';

const STORAGE_KEY = 'cookie-consent';
// Bump this when what "accept" covers changes (e.g. a new tracker is added) -
// stored consent from an older version is treated as no consent at all, so
// visitors who already chose under the old meaning are re-prompted rather
// than silently carrying a choice that no longer reflects what they agreed to.
const CONSENT_VERSION = 1;

interface StoredConsent {
  status: ConsentStatus;
  version: number;
}

interface CookieConsentContextType {
  consent: ConsentStatus | null;
  isBannerOpen: boolean;
  accept: () => void;
  reject: () => void;
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

function getStoredConsent(): ConsentStatus | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (parsed.version !== CONSENT_VERSION) return null;

    return parsed.status === 'accepted' || parsed.status === 'rejected' ? parsed.status : null;
  } catch {
    // Covers both real storage errors and pre-versioning values (a bare
    // "accepted"/"rejected" string isn't valid JSON) - either way, treat it
    // as no stored consent.
    return null;
  }
}

function setStoredConsent(status: ConsentStatus) {
  try {
    const value: StoredConsent = { status, version: CONSENT_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore localStorage errors (e.g. private browsing)
  }
}

interface CookieConsentProviderProps {
  children: React.ReactNode;
}

export default function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [consent, setConsent] = useState<ConsentStatus | null>(null);
  // Starts closed so the server render and first client render match; the
  // effect below opens it once we know (client-only) that no choice is stored.
  const [isBannerOpen, setIsBannerOpen] = useState(false);

  useEffect(() => {
    function sync() {
      const stored = getStoredConsent();
      setConsent(stored);
      setIsBannerOpen(stored === null);
    }

    sync();

    // Keeps multiple open tabs in sync if the choice changes in one of them
    // (e.g. accepting in one tab shouldn't leave another tab's banner open).
    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        sync();
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const accept = useCallback(() => {
    setStoredConsent('accepted');
    setConsent('accepted');
    setIsBannerOpen(false);
  }, []);

  const reject = useCallback(() => {
    setStoredConsent('rejected');
    setConsent('rejected');
    setIsBannerOpen(false);

    // Best-effort: if FullStory was already recording (the user is switching
    // an earlier "accept" to "reject" via the reopened banner), tell it to
    // stop. This can't undo anything already captured before this call.
    if (typeof window !== 'undefined' && window.FS) {
      window.FS.consent(false);
      window.FS.shutdown();
    }
  }, []);

  const openPreferences = useCallback(() => {
    setIsBannerOpen(true);
  }, []);

  return (
    <CookieConsentContext.Provider value={{ consent, isBannerOpen, accept, reject, openPreferences }}>
      {children}
    </CookieConsentContext.Provider>
  );
}
