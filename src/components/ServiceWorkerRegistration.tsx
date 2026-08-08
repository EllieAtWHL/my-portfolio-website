'use client';

import { useEffect } from 'react';

// Production-only: registering a service worker in dev fights Next's own
// hot-reloading (a cached response can mask the very changes you're trying
// to see). See public/sw.js for what it actually does.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  }, []);

  return null;
}
