// Minimal offline-awareness service worker (WEB-100). Deliberately does NOT
// precache the app shell or any other assets - only the single offline
// fallback page, served when a navigation request fails while offline.
// Everything else (JS/CSS/images/API calls) passes straight through to the
// network exactly as if this worker didn't exist.
//
// Cache Storage is shared by every service worker on this origin (WEB-194),
// so this worker must only ever delete caches it owns - identified by
// CACHE_PREFIX. Bobbin (/bobbin/, WEB-192) registers its own worker that
// precaches the whole game; deleting "every cache that isn't ours" here
// would wipe that precache on every sw.js update and break the game offline.
const CACHE_PREFIX = 'site-offline-fallback-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
// Pre-WEB-194 name, unprefixed - still ours, so clean it up explicitly.
const LEGACY_CACHE_NAMES = ['offline-fallback-v1'];
const OFFLINE_URL = '/offline.html';

const isOwnStaleCache = (key) =>
  key !== CACHE_NAME && (key.startsWith(CACHE_PREFIX) || LEGACY_CACHE_NAMES.includes(key));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(isOwnStaleCache).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.open(CACHE_NAME).then((cache) => cache.match(OFFLINE_URL))
    )
  );
});
