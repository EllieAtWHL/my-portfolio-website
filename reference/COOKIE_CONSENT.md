# Cookie Consent

Site-wide cookie consent gate (WEB-102, split from WEB-71 "GDPR compliance").
Nothing that sets a non-essential cookie loads until the visitor actively
allows it, with a separate choice per purpose (WEB-104):

| Category (`ConsentCategory`) | Banner label | Gates |
|---|---|---|
| `sessionRecording` | Session recording | **FullStory** |
| `analytics` | Analytics | **Vercel Analytics** and **Vercel Speed Insights** (WEB-64) |
| `spamProtection` | Spam protection | Google **reCAPTCHA** on the contact form |
| `embeds` | Embedded content | **Instagram post embeds** on Spurs Women match pages (WEB-147), **YouTube** videos (Lightning Rollout parts 1 and 2) and the **Spotify** track on London 2012's "My First Audition" (WEB-104) |

See `fullstory/README.md` for FullStory's own integration details -
this doc covers the consent layer that gates it (and the other trackers)
rather than duplicating that content.

## Architecture

| File | Role |
|------|------|
| `src/components/CookieConsentProvider.tsx` | React Context holding per-category consent state, backed by `localStorage`. Exports `useCookieConsent()`, `CONSENT_CATEGORIES` and the `ConsentCategory`/`ConsentChoices` types. |
| `src/components/CookieConsentBanner.tsx` | The visible banner: Reject all / Manage choices / Accept all, plus the per-category checkboxes. Holds each category's label and description copy. |
| `src/components/FullStoryLoader.tsx` | Loads `/public/fullstory-init.js` only once `hasConsent('sessionRecording')`. |
| `src/components/ConsentGatedVercelScripts.tsx` | Renders `@vercel/analytics/next`'s `<Analytics />` and `@vercel/speed-insights/next`'s `<SpeedInsights />` only once `hasConsent('analytics')`. |
| `src/app/contact-me/page.tsx` | Gates the Google reCAPTCHA script on `hasConsent('spamProtection')` (see "reCAPTCHA" below). |
| `src/components/ConsentGatedEmbed.tsx` | `ConsentGatedEmbed` renders its children (an iframe) only once `hasConsent('embeds')`, otherwise `EmbedConsentFallback`: a link to the content on the service, a note, and a "Cookie preferences" button. Used for YouTube and Spotify (see "Embedded content" below). |
| `src/components/spurs-women/InstagramPost.tsx` | Gates Meta's Instagram embed script on `hasConsent('embeds')`, using the same `EmbedConsentFallback` (see "Embedded content" below). |
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
  choices: ConsentChoices | null;  // null = no choice made yet
  hasConsent: (category: ConsentCategory) => boolean;  // false while choices is null
  isConsentKnown: boolean;  // false until the stored choice has been read client-side
  isBannerOpen: boolean;
  shouldFocusBanner: boolean;  // true only when openPreferences() opened it
  acceptAll: () => void;
  rejectAll: () => void;
  saveChoices: (choices: ConsentChoices) => void;
  openPreferences: () => void;  // reopens the banner
}
```

Gated components only ever call `hasConsent('<category>')` for their own
category - nothing checks "has the visitor accepted everything", so a
tracker can't accidentally load on another category's consent.

Stored in `localStorage` under `cookie-consent` as `{ choices, version }`:

```json
{
  "choices": { "sessionRecording": false, "analytics": true, "spamProtection": true, "embeds": false },
  "version": 4
}
```

A stored value is only used if every category in `CONSENT_CATEGORIES` is
present as a boolean; anything else counts as no stored consent. So adding
a new category is itself a shape change that re-prompts everyone, even
without remembering to bump the version (though do bump it).

**Versioning**: `CONSENT_VERSION` in `CookieConsentProvider.tsx` must be
bumped whenever what a category actually covers changes (e.g. a new tracker
is added to one) or the stored shape changes. A stored value
whose `version` doesn't match the current `CONSENT_VERSION` - including the
pre-versioning bare `"accepted"`/`"rejected"` string format this replaced, and
any malformed JSON - is treated as no consent at all, and the banner reopens.
This is deliberate: a visitor who already chose under an old meaning of
"accept" gets re-prompted rather than silently having their stale choice
carried forward to cover something new they never agreed to. `CONSENT_VERSION`
was bumped from 1 to 2 in WEB-64 when Vercel Speed Insights was added to the
gate - a worked example of this rule, not just a hypothetical - from 2
to 3 in WEB-147 when Instagram embeds were added, and from 3 to 4 in
WEB-104 when the single `{ status: 'accepted' | 'rejected' }` choice became
per-category `choices`. An old "accepted" isn't migrated to all-true: the
visitor agreed to one bundle, not to each category separately, so they're
asked again.

`acceptAll()`/`rejectAll()`/`saveChoices()` persist the choice and close the
banner. `openPreferences()` (wired to the footer's "Cookie preferences"
control) reopens it without clearing the stored choice, so the current
choices stay in effect until the visitor saves new ones.

Multiple open tabs are kept in sync via a `storage` event listener. A
choice made in one tab applies its new choices in every other open tab
(including the FullStory stop/restart below), and closes a *first-visit*
banner there. A banner the visitor deliberately reopened in another tab
stays open, so their unsaved ticks aren't thrown away mid-edit.

## The banner

- **First visit** (no stored choice): a short summary plus **Reject all**,
  **Manage choices** and **Accept all**. Manage choices reveals one checkbox
  per category, each with a one-line description, all unticked, and swaps
  that button for **Save choices**.
- **Reopened via "Cookie preferences"** (a choice already exists): opens
  straight on the checkboxes, pre-filled with the current choices, since
  someone reopening it has come to change something.
- **Reject all** and **Accept all** stay the same size and visible in both
  views, so declining is never more work than accepting (ICO guidance).
- The banner's content is only mounted while it's open, so unsaved checkbox
  edits and the summary/detail view reset each time it's reopened.
- The banner is capped at `max-h-[85vh]` with `overflow-y-auto`, so the
  expanded list stays scrollable on short phone screens instead of pushing
  the buttons off-screen. All buttons share `w-36 min-w-36`, the narrowest
  width that keeps "Manage choices" on one line; at phone width they wrap
  onto two rows.

### Withdrawing consent

Whenever a choice with `sessionRecording: false` is applied - `rejectAll()`,
`saveChoices()` with it unticked, or the same arriving from another tab - the
provider also calls `window.FS.consent(false)` and `window.FS.shutdown()` (if
FullStory is loaded) as a best-effort stop, since it may already be recording
by that point. If session recording is then turned back on in the same page
session, the provider calls `window.FS.consent(true)` and
`window.FS.restart()`. It has to: `FullStoryLoader`'s `<Script>` won't re-run
an already-loaded `src`, so re-rendering it alone wouldn't resume recording.
A ref tracks whether the provider stopped FullStory, so `restart()` is only
called after its own `shutdown()`. This can't undo
anything already captured before the call - there's no way to un-capture data
already sent - but it does stop further capture within the current session
without needing a page reload. Vercel Analytics, Vercel Speed Insights, and
reCAPTCHA don't have an equivalent runtime "stop" API;
`ConsentGatedVercelScripts`/the reCAPTCHA effect simply won't inject any of
these scripts on a future render once their category is turned off.

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

Every banner button is pinned to an explicit `w-36 min-w-36` because
`main-theme.css`'s `.button.secondary` carries an explicit `min-width: 150px`
that `.button.primary` doesn't - without the override they'd render at
different widths on the main site (the spurs variant doesn't have this
problem since all its buttons already share one CSS class there). Reject
all, Manage choices and Save choices use `secondary`; Accept all uses
`primary`. The checkboxes are native inputs tinted with `accent-color`:
`--brand-primary-light` (`--dark-accent` in dark mode) on the main site,
`--accent-spurs` on Spurs Women. No
`!important`/Tailwind `!` prefix is needed anywhere in this component:
`main-theme.css`/`spurs-theme.css` are imported `layer(base)` in
`globals.css`, and Tailwind's own utilities layer already comes after `base`,
so plain utility classes win without a specificity fight.

## reCAPTCHA

The contact form's Google reCAPTCHA loading effect (`src/app/contact-me/page.tsx`)
checks `hasConsent('spamProtection')` and simply doesn't inject the
reCAPTCHA `<script>` otherwise. Unlike the other trackers, this one has a
visible fallback: if the visitor hasn't allowed it, the form renders a
message asking them to allow "Spam protection" cookies (via the banner or
"Cookie preferences") to enable spam protection,
rather than silently rendering a broken widget. The form itself still
submits without it - rejecting cookies doesn't block using the contact form,
just the spam-protection widget.

## Embedded content

Third-party embeds that set cookies for a logged-out visitor wait for the
`embeds` category. Until it's allowed, each one renders `EmbedConsentFallback`
instead of rendering nothing: a plain link to the content on the service
(opens in a new tab), a note naming the service that sets the cookies, and a
"Cookie preferences" button that reopens the banner. The button doesn't opt
the visitor in by itself, so every consent choice still goes through the
banner. `theme="spurs"` switches the link and button to Spurs Women styling.

### YouTube and Spotify (`ConsentGatedEmbed`)

The Lightning Rollout YouTube videos (`LightningRolloutPart1.tsx`,
`LightningRolloutPart2.tsx`) use `<YouTubeEmbed videoId />`
(`src/components/YouTubeEmbed.tsx`). It wraps the iframe in
`ConsentGatedEmbed` and builds both the embed URL and the fallback's watch
link from the one ID, so the two can't drift apart. The London 2012
Spotify track (`src/app/london-2012/my-first-audition/page.tsx`) wraps its
iframe in `<ConsentGatedEmbed service href linkLabel>` directly. The iframe isn't rendered at
all until `embeds` is allowed, so nothing is requested from YouTube or
Spotify before then. Like `InstagramPost`, it renders nothing while
`isConsentKnown` is false.

To gate a new iframe embed, wrap it the same way. `ConsentGatedEmbed` is a
client component, but it can be used from a server component page (London
2012's is one).

### Instagram

`InstagramPost.tsx` (Spurs Women match media - see "Social post embeds" in
`spurs-women/README.md`) only injects Meta's `embed.js` once
`hasConsent('embeds')`, because Meta's embed sets `instagram.com`/
`facebook.com` cookies even for logged-out viewers. It can't just use
`ConsentGatedEmbed`, because it builds its embed imperatively in an effect,
but it renders the same `EmbedConsentFallback` (`theme="spurs"`). It renders nothing
at all while `isConsentKnown` is still false (`choices` is `null` both before
the stored choice is read and when no choice exists), so a returning visitor
who already accepted isn't briefly told to accept cookies. The fallback and
embed elements are keyed apart so withdrawing consent replaces the element
outright - otherwise React would reuse the container `div` and leave the
iframe Meta's script injected into it alive.

### What was checked, and what stays ungated

Checked on 2026-11-10 (WEB-226's audit, done as part of WEB-104): each
embed loaded in a fresh, logged-out Playwright Chromium profile with
cookies cleared, scrolled into view, without pressing play.

| Embed | Cookies set on load | Decision |
|---|---|---|
| YouTube (`www.youtube.com/embed`) | `VISITOR_INFO1_LIVE`, `VISITOR_PRIVACY_METADATA`, `__Secure-YNID`, `__Secure-ROLLOUT_TOKEN` (180 days), `YSC` | Gated |
| Spotify (`open.spotify.com/embed`) | `sp_t` (365 days), `sp_landing` | Gated |
| Bluesky (`embed.bsky.app`) | None, and no iframe storage | Ungated |
| OpenStreetMap (`openstreetmap.org/export/embed.html`) | None, and no iframe storage | Ungated |
| YouTube thumbnails (`img.youtube.com`, Spurs Women home video grid) | None | Ungated |

Spurs Women match videos (`video-external` media) are plain links, not
embeds, so there's nothing to gate.

If Bluesky or OpenStreetMap start setting cookies, or a new embed is added,
re-run the same check and gate it under `embeds` rather than adding a new
category. Switching YouTube to `youtube-nocookie.com` was considered. It's
documented as setting no cookies until playback, but it hasn't been checked
here, and gating covers it either way.

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
  order. Keyboard users reach the banner's buttons (and checkboxes) as the
  very first focusable elements on the page, instead of only after tabbing through the entire
  page (nav, content, footer).
- The banner is a `role="region" aria-label="Cookie consent"`, and only its
  summary sentence is `aria-live="polite"`. That announces the banner when it
  appears, without forcibly moving focus into it on a first visit: it isn't
  a modal dialog, and the rest of the page stays usable while it's open.
  Before WEB-104 the whole region was the live region (with
  `aria-atomic="true"`). With a checkbox list inside, that would have read
  every category description out the moment Manage choices was pressed.
- When the visitor opens the banner on purpose, through either a footer
  "Cookie preferences" control or the button under a blocked embed,
  `openPreferences()` sets `shouldFocusBanner` and the banner focuses its
  region (`tabIndex={-1}`). Without that, a keyboard user pressing the
  button mid-article would get no feedback, and the controls could be a
  long way off in tab order. The next Tab reaches the first checkbox.
- The checkboxes sit in a `<fieldset>` with a visually hidden `<legend>`;
  each has a real `<label>` (the category name) and its description wired up
  via `aria-describedby`. When Manage choices is swapped for Save choices,
  React reuses the same `<button>` element, so keyboard focus stays in place
  instead of falling back to the top of the page.

## Testing

- `src/components/__tests__/CookieConsentProvider.test.tsx` - storage
  read/write for accept all / reject all / mixed choices,
  versioning/migration behavior (every older version including v3's single
  status, missing or non-boolean categories, pre-versioning bare string,
  malformed JSON all treated as no consent), multi-tab sync (first-visit
  banner closes, a reopened one stays open), the FullStory shutdown whenever
  session recording ends up off and restart when it's turned back on, and
  `shouldFocusBanner` only being set by `openPreferences()`.
- `src/components/__tests__/CookieConsentBanner.test.tsx` - open/closed
  rendering, summary vs. detail view, Save choices passing exactly the
  ticked categories, pre-filled choices on reopen, focus only when asked
  for, the checkbox list staying outside the live region, per-section
  (`usePathname`) theming.
- `src/components/__tests__/FullStoryLoader.test.tsx` /
  `ConsentGatedVercelScripts.test.tsx` - each loads only for its own
  category (including staying off when every *other* category is allowed).
  The contact page and Instagram tests below follow the same pattern.
- `src/app/contact-me/__tests__/page.test.tsx` /
  `page.localhost.test.tsx` - reCAPTCHA gating and the localhost skip path
  (jsdom's `window.location` isn't reassignable at runtime in this jsdom
  version, so the non-localhost case is covered via a
  `@jest-environment-options` URL docblock instead, matching
  `src/lib/__tests__/fullstory.non-localhost.test.ts`'s existing pattern).
- `src/components/__tests__/YouTubeEmbed.test.tsx` - embed URL and fallback
  link both derived from the video ID.
- `src/components/__tests__/ConsentGatedEmbed.test.tsx` - the iframe gate
  (nothing until consent is known, fallback until `embeds` is allowed, even
  when everything else is) and the fallback's link, button and theming.
- `src/components/spurs-women/__tests__/InstagramPost.test.tsx` - the
  Instagram embed's gating and fallback link.
- `src/components/__tests__/LightningRolloutPart1.test.tsx` / `Part2` -
  render inside a real `CookieConsentProvider`, since their videos are
  gated.
- `src/components/__tests__/Footer.test.tsx` /
  `src/components/spurs-women/__tests__/SpursFooter.test.tsx` - the
  "Cookie preferences" control reopens the banner.

## Known follow-ups

- **WEB-103** (privacy policy page) will need to describe what's gated here,
  per category, in plain language - not yet written, tracked separately.
