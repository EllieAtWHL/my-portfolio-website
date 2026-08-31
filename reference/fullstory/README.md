# FullStory Analytics

This site uses FullStory for user session recording and analytics.

- **Organization ID**: `o-1J8NQN-na1`
- **Dashboard**: https://app.fullstory.com
- **Help Center**: https://help.fullstory.com

**Consent-gated (WEB-102)**: the script below only loads once a visitor
accepts the site's cookie consent banner - see
[`../COOKIE_CONSENT.md`](../COOKIE_CONSENT.md) for the consent layer that
gates this (and Vercel Analytics, and the contact form's reCAPTCHA). This doc
covers the FullStory integration itself; that one covers when it's allowed
to run.

## Architecture

- **`/public/fullstory-init.js`** - Initialization script (org ID hardcoded here)
- **`/src/components/FullStoryLoader.tsx`** - Loads the script via Next.js `Script`, gated on consent (see `COOKIE_CONSENT.md`)
- **`/src/lib/fullstory.ts`** - Tracking utilities and helper functions
- **`/src/hooks/useFullStory.ts`** - React hook for FullStory integration

The script is loaded from an external file (not `dangerouslySetInnerHTML`),
via `FullStoryLoader.tsx` rather than directly in the root layout, so it can
be conditionally rendered based on consent:

```tsx
// src/components/FullStoryLoader.tsx
import Script from 'next/script';

if (consent !== 'accepted') return null;
return <Script src="/fullstory-init.js" strategy="afterInteractive" />;
```

Before WEB-102, this was an unconditional `beforeInteractive` `<Script>` in
`src/app/layout.tsx`. It's now `afterInteractive` and only ever rendered
post-consent, so it necessarily loads later than before - an intentional
trade-off, not a regression, since the whole point is that it must not run
until the visitor has actively agreed to it.

```javascript
// public/fullstory-init.js
window['_fs_host'] = 'fullstory.com';
window['_fs_script'] = 'edge.fullstory.com/s/fs.js';
window['_fs_org'] = 'o-1J8NQN-na1';
window['_fs_namespace'] = 'FS';
```

**Environment variables**: Not currently implemented. Neither
`NEXT_PUBLIC_FULLSTORY_ORG` nor `NEXT_PUBLIC_FULLSTORY_DEBUG` is read anywhere
in `src/` or `public/` - the org ID is hardcoded directly in
`fullstory-init.js`. If env-based configuration is ever needed, it would
require templating that file at build time or reading
`process.env.NEXT_PUBLIC_FULLSTORY_ORG` from a script that sets
`window['_fs_org']`.

### TypeScript types

```typescript
// src/lib/fullstory.ts
interface FullStoryAPI {
  event: (name: string, properties?: Record<string, unknown>) => void;
  setUserVars: (vars: Record<string, unknown>) => void;
  anonymize: () => void;
  shutdown: () => void;
  restart: () => void;
  log: (level: string, message: string) => void;
  consent: (granted: boolean) => void;
}

declare global {
  interface Window {
    FS?: FullStoryAPI;
  }
}
```

Note: there's no TypeScript declaration for `_fs_host`/`_fs_script`/`_fs_org`/
`_fs_namespace` anywhere in `src/` - those are only ever set as plain
untyped JS globals by `public/fullstory-init.js`. `FS.identify(...)` isn't
part of the typed `FullStoryAPI` interface above either (it's not called
anywhere in this codebase - see "Raw window.FS API" below, which is
illustrative of the vendor API rather than something this repo type-checks).

## Environment Detection

The FullStory *script* itself loads on every domain, including
`localhost:3000` in development, with no environment gating. But the
*tracking calls* are gated in code: `trackEvent()` and `setUserVars()` in
`src/lib/fullstory.ts` both no-op when `window.location.hostname ===
'localhost'`, and every higher-level helper (`trackNavigation`,
`trackFormInteraction`, `trackButtonClick`, `trackPageView`, `trackError`)
is built on `trackEvent()`, so it inherits the same gate. In practice this
means the script loads locally but sends no events - see
`src/lib/__tests__/fullstory.test.ts` (localhost gate) and
`fullstory.non-localhost.test.ts` (non-localhost path) for the tests
covering this. If you want to separate *sessions* by environment on the
FullStory dashboard side (since the script load itself isn't gated),
segment on `window.location.hostname`, e.g.:

```javascript
const isProduction = window.location.hostname !== 'localhost';
```

## What's Currently Tracked

- **Page views**: Home (`/`), Contact (`/contact-me`), Thank You (`/contact-me/thank-you`)
- **Form interactions**: Contact form start → success → thank-you page visit
- **Button clicks**: Contact Me button on the home page hero
- **Errors**: `trackError()` is called from four route-level error boundaries - `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/spurs-women/error.tsx` (WEB-97, the original call site), and `src/app/spurs-women/admin/error.tsx` - plus the reusable `src/components/ErrorBoundary.tsx` class component for subtree-level boundaries (not currently rendered anywhere in the app; it exists for a future subtree that needs to fail without unmounting the whole page, per its own doc comment). `trackError()` (like the rest of this file) only works from client-rendered code (`window.FS`), so it's not called from API route handlers or `src/lib/data/cache-utils.ts`'s `CacheError` path, both of which run server-side and would make it a silent no-op. Server-side errors remain `console.error`-only; a real server-side error-tracking integration is separate, larger scope than this helper.
- **Session-level data**: No user identification (appropriate for a portfolio site where users don't log in)

### Usage examples

```typescript
// Page view tracking
useEffect(() => {
  trackPageView('/contact-me', 'Contact Me');
}, []);

// Button click tracking
const handleContactClick = () => {
  trackEvent('Button Clicked', {
    buttonName: 'Contact Me',
    page: '/',
    section: 'hero',
    timestamp: new Date().toISOString(),
  });
};

// Form interaction tracking
trackFormInteraction('contact', 'start');
trackFormInteraction('contact', 'success');
```

Raw `window.FS` API (used internally by the helpers above, or directly for
one-offs):

```javascript
FS.event('Button Clicked', { button_name: 'Contact Me', page: '/contact-me' });
FS.identify('user-123', { displayName: 'John Doe' }); // not used on this site - no logins
FS.setUserVars({ sessionSource: 'direct_traffic' });
FS.anonymize();
FS.shutdown();
FS.restart();
```

## Privacy & Security

- No `dangerouslySetInnerHTML` - external file approach avoids inline script injection risk
- FullStory automatically excludes password fields and other sensitive input types
- Exclude custom elements/sections with `data-fs-exclude`:

```html
<input type="password" data-fs-exclude />
<div data-fs-exclude>Sensitive content</div>
```

- Never expose sensitive personal data in recordings; regularly audit recorded data and limit FullStory dashboard access to authorized people.
- If using a CSP, allow the FullStory hosts - this repo's actual CSP (`next.config.ts`) covers the script load via `script-src` and event/recording traffic via a `connect-src` wildcard:
  ```
  script-src 'self' https://edge.fullstory.com;
  connect-src 'self' https://*.fullstory.com;
  ```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Script not loading | Check `/public/fullstory-init.js` exists; check browser console for errors |
| No sessions recorded | Verify org ID: `o-1J8NQN-na1`; check network tab for FullStory requests; confirm domain isn't blocked by an ad blocker |
| TypeScript errors | Ensure the global `Window.FS` declaration above is in scope |
| Performance concerns | Already on `afterInteractive`; consider `lazyOnload` for further deferral if needed |

Debug in the browser console:

```javascript
console.log('FullStory loaded:', !!window.FS);
console.log('FullStory version:', window.FS?._v);
window.FS?.event('Debug Test', { timestamp: Date.now() });
```

## Loading Strategy Reference

| Strategy | Use case | Impact |
|----------|----------|--------|
| `beforeInteractive` | Critical analytics | Loads before hydration |
| `afterInteractive` (current) | Non-critical analytics | Loads after page ready |
| `lazyOnload` | Optional analytics | Loads on user interaction |

`afterInteractive` since WEB-102 (see "Architecture" above) - before that it was an unconditional `beforeInteractive`.

## Testing

```typescript
// src/lib/__tests__/fullstory.test.ts
describe('FullStory Integration', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'FS', {
      value: { event: jest.fn() },
      writable: true,
    });
  });

  it('tracks events correctly', () => {
    trackEvent('Test Event', { test: true });
    expect(window.FS.event).toHaveBeenCalledWith('Test Event', { test: true });
  });
});
```

The real test file also covers the localhost-gating behavior described
above, plus a `fullstory.non-localhost.test.ts` sibling (pinned to a
non-localhost hostname via a `@jest-environment-options` docblock) for the
non-gated path.

Mock `@/lib/fullstory` in component tests that don't care about analytics:

```tsx
jest.mock('@/lib/fullstory', () => ({
  trackEvent: jest.fn(),
  trackPageView: jest.fn(),
}));
```
