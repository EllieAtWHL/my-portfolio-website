# Cookie Consent

Site-wide cookie consent gate (WEB-102, split from WEB-71 "GDPR compliance").
Nothing that sets a non-essential cookie loads until the visitor actively
accepts: **FullStory** (session recording), **Vercel Analytics** and
**Vercel Speed Insights** (WEB-64), and Google **reCAPTCHA** on the contact
form. See `fullstory/README.md` for FullStory's own integration details -
this doc covers the consent layer that gates it (and the other trackers)
rather than duplicating that content.

## Architecture

| File | Role |
|------|------|
| `src/components/CookieConsentProvider.tsx` | React Context holding consent state, backed by `localStorage`. Exports `useCookieConsent()`. |
| `src/components/CookieConsentBanner.tsx` | The visible Accept/Reject banner. |
| `src/components/FullStoryLoader.tsx` | Loads `/public/fullstory-init.js` only once `consent === 'accepted'`. |
| `src/components/ConsentGatedVercelScripts.tsx` | Renders `@vercel/analytics/next`'s `<Analytics />` and `@vercel/speed-insights/next`'s `<SpeedInsights />` only once `consent === 'accepted'`. |
| `src/app/contact-me/page.tsx` | Gates the Google reCAPTCHA script the same way (see "reCAPTCHA" below). |
| `src/components/Footer.tsx` / `src/components/spurs-women/SpursFooter.tsx` | Render a "Cookie preferences" icon control that reopens the banner. |
| `src/components/CookieIcon.tsx` | The icon used by that control. |

All of it is wired into the root layout (`src/app/layout.tsx`):

```tsx
<ThemeProvider>
  <CookieConsentProvider>
    <OfflineBanner />
    <CookieConsentBanner />   {/* before {children} - see "Tab order" below */}
    {children}
    <FullStoryLoader />
    <ConsentGatedVercelScripts />
  </CookieConsentProvider>
</ThemeProvider>
```

`CookieConsentProvider` wraps the whole app once at the root - not per
section - because the consent choice must be shared between the main site
and Spurs Women, not re-asked when navigating between them.

## Consent state and storage

`useCookieConsent()` returns:

```ts
{
  consent: 'accepted' | 'rejected' | null;  // null = no choice made yet
  isBannerOpen: boolean;
  accept: () => void;
  reject: () => void;
  openPreferences: () => void;  // reopens the banner
}
```

Stored in `localStorage` under `cookie-consent` as `{ status, version }`, not
a bare string:

```json
{ "status": "accepted", "version": 2 }
```

**Versioning**: `CONSENT_VERSION` in `CookieConsentProvider.tsx` must be
bumped whenever what "accept" actually covers changes (e.g. a new tracker is
added, or WEB-104 below splits this into per-tracker toggles). A stored value
whose `version` doesn't match the current `CONSENT_VERSION` - including the
pre-versioning bare `"accepted"`/`"rejected"` string format this replaced, and
any malformed JSON - is treated as no consent at all, and the banner reopens.
This is deliberate: a visitor who already chose under an old meaning of
"accept" gets re-prompted rather than silently having their stale choice
carried forward to cover something new they never agreed to. `CONSENT_VERSION`
was bumped from 1 to 2 in WEB-64 when Vercel Speed Insights was added to the
gate - a worked example of this rule, not just a hypothetical.

`accept()`/`reject()` persist the choice and close the banner.
`openPreferences()` (wired to the footer's "Cookie preferences" control)
reopens it without clearing the stored choice, so the current Accept/Reject
state is still whatever was last chosen until the visitor picks again.

Multiple open tabs are kept in sync via a `storage` event listener - accepting
in one tab closes the banner in another already-open tab too.

### Withdrawing consent

`reject()` (including via the reopened banner, after a prior `accept()`) also
calls `window.FS.consent(false)` and `window.FS.shutdown()` as a best-effort
stop, since FullStory may already be recording by that point. This can't undo
anything already captured before the call - there's no way to un-capture data
already sent - but it does stop further capture within the current session
without needing a page reload. Vercel Analytics, Vercel Speed Insights, and
reCAPTCHA don't have an equivalent runtime "stop" API;
`ConsentGatedVercelScripts`/the reCAPTCHA effect simply won't inject any of
these scripts on a future render once `consent` flips back away from
`'accepted'`.

## Per-section theming

`CookieConsentBanner` is rendered once at the root layout, so it sits outside
the per-route `<SpursWrapper>` that normally scopes Spurs Women's
`spurs-button`/navy-gradient CSS (`spurs-theme.css`). It uses
`usePathname()` to detect `/spurs-women/*` routes and switches both the
container styling and the `Button` `variant` prop accordingly:

- **Main site**: `variant="secondary"`/`"primary"`, background/border/text
  colors pulled from the same `--dark-bg-1`/`--dark-accent`/`--dark-text`
  CSS variables `main-theme.css` uses for other dark-mode surfaces (not
  Tailwind's generic `gray-900`, which reads with a blue cast against this
  site's green dark theme).
- **Spurs Women**: `variant="spurs"` for both buttons (there's no separate
  "spurs secondary" style in the codebase - `FormModal.tsx`'s
  Cancel/Delete/Submit buttons follow the same one-variant-for-everything
  pattern), and the container reuses the `spurs-wrapper` CSS class directly
  (with its `padding-top: 80px` reset to `pt-4` for this bottom-fixed
  context) rather than duplicating spurs-theme.css's navy gradient.

Both Reject and Accept are pinned to an explicit `w-28 min-w-28` because
`main-theme.css`'s `.button.secondary` carries an explicit `min-width: 150px`
that `.button.primary` doesn't - without the override they'd render at
different widths on the main site (the spurs variant doesn't have this
problem since both buttons already share one CSS class there). No
`!important`/Tailwind `!` prefix is needed anywhere in this component:
`main-theme.css`/`spurs-theme.css` are imported `layer(base)` in
`globals.css`, and Tailwind's own utilities layer already comes after `base`,
so plain utility classes win without a specificity fight.

## reCAPTCHA

The contact form's Google reCAPTCHA loading effect (`src/app/contact-me/page.tsx`)
checks `consent === 'accepted'` the same way `FullStoryLoader`/
`ConsentGatedVercelScripts` do, and simply doesn't inject the reCAPTCHA `<script>`
otherwise. Unlike the other trackers, this one has a visible fallback:
if the visitor hasn't accepted, the form renders a message asking them to
accept cookies (or use "Cookie preferences") to enable spam protection,
rather than silently rendering a broken widget. The form itself still
submits without it - rejecting cookies doesn't block using the contact form,
just the spam-protection widget.

## Reopening the banner ("Cookie preferences")

Both footers render a small icon-only button (`CookieIcon`, no visible text,
`aria-label="Cookie preferences"`) that calls `openPreferences()`:

- **Main site** (`Footer.tsx`): next to the dark-mode toggle, styled to
  inherit the footer's `--bg-light-1` text color like the neighbouring
  sun/moon icons - the shared `Button` `ghost` variant's default
  `text-gray-*` classes assume a plain page background, not the footer's
  always-colored one.
- **Spurs Women** (`SpursFooter.tsx`): next to the Bluesky link, using
  `variant="spurs"` (it's rendered inside `<SpursWrapper>`, so the
  `spurs-button` styling applies normally here, unlike the banner above).

While building this, `Button`'s `ghost` variant turned out to have never
actually been exercised in production before (only in an unused
`ButtonExamples.tsx` demo) - it rendered with a solid background instead of
being text-only, because the shared `button` class in `Button.tsx`'s
`baseClasses` also picks up `main-theme.css`'s gradient `.button` background,
and in dark mode a separate global `.dark button, .dark .button` rule, with
nothing in the `ghost` variant to beat either. Fixed at the source
(`bg-transparent dark:bg-transparent` added to `ghost`) so any future use of
that variant gets a real transparent background, not just this button.

## Accessibility

- The banner is rendered *before* `{children}` in `layout.tsx`, not after -
  its `fixed` positioning keeps it visually pinned to the bottom of the
  viewport regardless of DOM order, but DOM order still determines tab
  order. Keyboard users reach Reject/Accept as the very first two focusable
  elements on the page, instead of only after tabbing through the entire
  page (nav, content, footer).
- `role="region" aria-label="Cookie consent" aria-live="polite" aria-atomic="true"`
  announces the banner to screen reader users when it appears, without
  forcibly moving focus into it - it isn't a modal dialog, the rest of the
  page stays usable while it's open, and grabbing focus is normally reserved
  for actual modals.

## Testing

- `src/components/__tests__/CookieConsentProvider.test.tsx` - storage
  read/write, versioning/migration behavior (stale version, pre-versioning
  bare string, malformed JSON all treated as no consent), multi-tab sync,
  `reject()`'s FullStory shutdown call.
- `src/components/__tests__/CookieConsentBanner.test.tsx` - open/closed
  rendering, per-section (`usePathname`) theming.
- `src/components/__tests__/FullStoryLoader.test.tsx` /
  `ConsentGatedVercelScripts.test.tsx` - gating behavior per consent value.
- `src/app/contact-me/__tests__/page.test.tsx` /
  `page.localhost.test.tsx` - reCAPTCHA gating and the localhost skip path
  (jsdom's `window.location` isn't reassignable at runtime in this jsdom
  version, so the non-localhost case is covered via a
  `@jest-environment-options` URL docblock instead, matching
  `src/lib/__tests__/fullstory.non-localhost.test.ts`'s existing pattern).
- `src/components/__tests__/Footer.test.tsx` /
  `src/components/spurs-women/__tests__/SpursFooter.test.tsx` - the
  "Cookie preferences" control reopens the banner.

## Known follow-ups

- **WEB-103** (privacy policy page) will need to describe what's gated here
  in plain language - not yet written, tracked separately.
- **WEB-104** (granular consent): FullStory (high-risk session recording),
  Vercel Analytics and Vercel Speed Insights (low-risk, largely cookieless),
  and reCAPTCHA (third-party Google cookie) currently share a single
  Accept/Reject choice. An
  independent GDPR/cookie-consent review of WEB-102 flagged this as worth
  splitting into per-tracker toggles eventually, but not urgent enough to
  block WEB-102 shipping for this site's risk profile. Implementing it will
  require a `CONSENT_VERSION` bump (see "Versioning" above), since the
  stored `{ status, version }` shape doesn't yet support per-tracker choices.
