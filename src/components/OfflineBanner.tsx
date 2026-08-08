'use client';

import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return !navigator.onLine;
}

// Never render as offline on the server - navigator.onLine doesn't exist
// there, and this avoids a hydration mismatch for the common case (loading
// the page while online).
function getServerSnapshot() {
  return false;
}

export function OfflineBanner() {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      // Fixed + above the site's fixed navbar (z-index: 100 in main-theme.css;
      // z-[200] matches SkipLink's convention for the same reason) - the
      // navbar's position: fixed means a normal in-flow banner would render
      // correctly in the DOM but sit visually behind it, invisible.
      className="fixed top-0 inset-x-0 z-[200] bg-amber-100 dark:bg-amber-900 border-b border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-200 text-sm text-center py-2 px-4"
    >
      You&apos;re offline. Some content may not be available until your connection is restored.
    </div>
  );
}
