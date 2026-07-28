# FullStory Analytics

This site uses FullStory for user session recording and analytics.

- **Organization ID**: `o-1J8NQN-na1`
- **Dashboard**: https://app.fullstory.com
- **Help Center**: https://help.fullstory.com

## Architecture

- **`/public/fullstory-init.js`** - Initialization script (org ID hardcoded here)
- **`/src/app/layout.tsx`** - Root layout, loads the script via Next.js `Script` component
- **`/src/lib/fullstory.ts`** - Tracking utilities and helper functions
- **`/src/hooks/useFullStory.ts`** - React hook for FullStory integration

The script is loaded from an external file (not `dangerouslySetInnerHTML`) using
the `beforeInteractive` strategy, so it loads before the page becomes
interactive:

```tsx
// src/app/layout.tsx
import Script from 'next/script';

<Script src="/fullstory-init.js" strategy="beforeInteractive" />
```

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
declare global {
  interface Window {
    _fs_host?: string;
    _fs_script?: string;
    _fs_org?: string;
    _fs_namespace?: string;
    FS?: {
      event: (name: string, properties?: Record<string, any>) => void;
      identify: (uid: string, vars?: Record<string, any>) => void;
      setUserVars: (vars: Record<string, any>) => void;
      anonymize: () => void;
      shutdown: () => void;
      restart: () => void;
      log: (level: string, message: string) => void;
      consent: (granted: boolean) => void;
    };
  }
}
```

## Environment Detection

FullStory records on every domain, including `localhost:3000` in development.
There's no environment gating in code today - if you want to separate
data by environment, create segments in FullStory based on
`window.location.hostname` on the dashboard side, e.g.:

```javascript
const isProduction = window.location.hostname !== 'localhost';
```

## What's Currently Tracked

- **Page views**: Home (`/`), Contact (`/contact-me`), Thank You (`/contact-me/thank-you`)
- **Form interactions**: Contact form start → success → thank-you page visit
- **Button clicks**: Contact Me button on the home page hero
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
- If using a CSP, allow the FullStory hosts:
  ```
  script-src 'self' https://edge.fullstory.com https://www.fullstory.com;
  ```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Script not loading | Check `/public/fullstory-init.js` exists; check browser console for errors |
| No sessions recorded | Verify org ID: `o-1J8NQN-na1`; check network tab for FullStory requests; confirm domain isn't blocked by an ad blocker |
| TypeScript errors | Ensure the global `Window.FS` declaration above is in scope |
| Performance concerns | Consider `afterInteractive` or `lazyOnload` strategy instead of `beforeInteractive` |

Debug in the browser console:

```javascript
console.log('FullStory loaded:', !!window.FS);
console.log('FullStory version:', window.FS?._v);
window.FS?.event('Debug Test', { timestamp: Date.now() });
```

## Loading Strategy Reference

| Strategy | Use case | Impact |
|----------|----------|--------|
| `beforeInteractive` (current) | Critical analytics | Loads before hydration |
| `afterInteractive` | Non-critical analytics | Loads after page ready |
| `lazyOnload` | Optional analytics | Loads on user interaction |

## Testing

```typescript
// __tests__/fullstory.test.ts
describe('FullStory Integration', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'FS', {
      value: { event: jest.fn(), identify: jest.fn() },
      writable: true,
    });
  });

  it('tracks events correctly', () => {
    trackEvent('Test Event', { test: true });
    expect(window.FS.event).toHaveBeenCalledWith('Test Event', { test: true });
  });
});
```

Mock `@/lib/fullstory` in component tests that don't care about analytics:

```tsx
jest.mock('@/lib/fullstory', () => ({
  trackEvent: jest.fn(),
  trackPageView: jest.fn(),
}));
```
