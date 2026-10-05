// Bobbin's service worker (WEB-197). The Vite build (vite.config.ts) turns
// this template into public/bobbin/sw.js, filling in the build's file list
// and a version hash - don't edit the generated file.
//
// Scope is "/bobbin/" (the default for a worker at /bobbin/sw.js) and the
// game page is /bobbin/play - see next.config.ts for why the scope must end
// in a slash (Android) and why the page can't be "/bobbin/" itself.
//
// Strategy: precache every file of the build on install, then serve
// everything under /bobbin/ cache-first, so the game works fully offline. A
// new deploy means a new version: the new worker installs in the background
// and waits; it takes over on the next launch, or straight away if the
// player taps "Update" (src/pwa.ts posts SKIP_WAITING).
//
// Cache Storage is shared with every other worker on the origin (the site's
// root /sw.js, WEB-194), so this worker only ever deletes caches carrying
// its own prefix.

const CACHE_PREFIX = "bobbin-";
const VERSION = "__VERSION__";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const PRECACHE = __PRECACHE__;
const APP_SHELL = "/bobbin/index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/bobbin/")) return;

  // Page loads always get the app shell (offline too); everything else is
  // served from the precache, falling back to the network for anything the
  // build didn't list.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(APP_SHELL, { cacheName: CACHE_NAME }).then((hit) => hit ?? fetch(request)),
    );
    return;
  }
  event.respondWith(
    caches.match(request, { cacheName: CACHE_NAME, ignoreSearch: true }).then((hit) => hit ?? fetch(request)),
  );
});
