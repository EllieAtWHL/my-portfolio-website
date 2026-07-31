# Tailwind Adoption: Current State & Migration Plan

## Why this document exists

There's a long-standing intent to "make better use of Tailwind through the site." Two earlier attempts at this stalled and were abandoned (see git history around `refactor/tailwind-implementation` and `feature/api-documentation`, February 2026) — they tried to solve a hardcoded-color problem in `globals.css` that has since been solved a different way (see [`CSS_ARCHITECTURE.md`](CSS_ARCHITECTURE.md)). This document assesses where things actually stand today and proposes a lower-risk path forward.

## Critical finding: two live config bugs, now fixed (Track 0, done)

While attempting a small pilot fix, I found that **every custom color defined in `tailwind.config.ts` — `brand-*`, `spurs-*`, `dark-*` — generated zero CSS**, anywhere on the site, and separately that **every `dark:` Tailwind utility followed the OS's `prefers-color-scheme`, not the site's own `.dark`/`.light` toggle**. Both were live bugs, not migration nice-to-haves: components using either were silently mis-rendering, including in production.

**Root cause (both bugs):** the site is on Tailwind v4 (`@tailwindcss/postcss` + `@import "tailwindcss"` in `globals.css`), which reads theme configuration from CSS `@theme` blocks and dark-mode strategy from `@custom-variant`, not from a `theme.extend`/`darkMode` object in a JS config file. `tailwind.config.ts` was a leftover from a pre-v4 setup that never got reconnected. I tested the documented v3-compatibility bridge (`@config "../../tailwind.config.ts";`) and confirmed via the actual compiled CSS bundle that it did not work in this Next.js/Turbopack setup.

**Fix applied** (`src/app/globals.css`, `tailwind.config.ts` deleted):
```css
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-brand-dark: var(--brand-primary-dark);
  --color-spurs-accent: var(--spurs-dark-accent);
  --color-dark-accent: var(--dark-accent);
  /* ...one --color-* per token, plus --background-image-* for the two gradients */
}
```
Verified via the compiled CSS bundle (correct `:where(.dark, .dark *)` selectors and `--color-*` rules now present, where before there were none), and via the real theme toggle in-browser across the home page, Regicide, London 2012, and Contact pages, in both themes — no visual regressions, and the Regicide/London 2012 `dark:` styling that previously ignored the toggle now responds correctly.

**Also fixed** — a few already-shipped components used class names that didn't match any real token (typos from before anyone could notice, since inert-but-correct and inert-but-wrong looked identical):
- `src/components/London2012Layout.tsx` — `text-brand-primary-dark` → `text-brand-dark` (×2)
- `src/components/London2012Sidebar.tsx` — `border-brand-primary-dark` → `border-brand-dark`; and a bare `brand-primary-dark hover:brand-primary-darker` (missing the `text-` prefix entirely, so it was never a Tailwind class at all, in any version) → `text-brand-dark hover:text-brand-darker`
- `src/components/admin/TabNav.tsx` — `hover:text-spurs-dark-accent` → `hover:text-spurs-accent`
- Added `--color-dark-gray-medium` to `@theme` since `London2012Layout.tsx`'s `dark:text-dark-gray-medium` already had a backing CSS variable (`--dark-gray-medium`), just missing from the token list.

**Found, deliberately NOT fixed** (separate, pre-existing bugs, no clear correct answer to guess at):
- `src/components/spurs-women/PodcastCard.tsx:50` — `text-spurs-gray` matches no token and no CSS variable. Left as-is rather than invent a color.
- `src/components/London2012Layout.tsx:17,54` — `bg-pale-green`, `dark:bg-third-colour`, `border-pale-green`, `dark:lg:border-third-colour` have never been defined anywhere (not in the old JS config, not as CSS variables) since this component was first written. Currently invisible as a bug because an ancestor element's background shows through, but it's not intentionally transparent. Also `text-neutral-gray` on the same file's "Navigation" label doesn't match any token either.
- `src/app/spurs-women/admin/page.tsx:373` — `bg-red-600` for a destructive-action state, with no brand equivalent to swap to (see "no error token" below).

**One more caveat worth knowing:** the hand-written CSS files (`main-theme.css`, `globals.css`, etc.) are not wrapped in a Tailwind `@layer`. Per the CSS Cascade Layers spec, unlayered styles always beat layered ones regardless of selector specificity — so on the rare element that's targeted by both a Tailwind utility *and* a generic unscoped hand-written selector (e.g. a bare `h3 { color: ... }` rule in `globals.css`), the hand-written rule silently wins even when the Tailwind class is completely valid. Confirmed this on one heading in `London2012Layout.tsx`: fixing its `text-brand-dark` class didn't change its rendered color, because a global `h3` rule was already dictating it (this isn't a regression — that element was already showing the same color before, just for the "config is broken" reason instead of the "cascade layers" reason). Not fixed here — restructuring the hand-written CSS into layers is a bigger, separate, sitewide-cascade-risk change, out of scope for this pass.

## Current state

The site runs **two parallel styling systems** that don't talk to each other:

1. **Hand-written, modular CSS** (`src/styles/*.css` + `globals.css`), using semantic class names (`.about-container`, `.project-card`) and CSS custom properties defined in `variables.css` (`--brand-primary-dark`, `--dark-accent`, etc.). This is the majority approach — documented, consistent, and covers most of the original portfolio pages (About, Experience, Projects, 404, main theme).

2. **Tailwind utility classes**, used directly in JSX. About half the component/page files (80 of 149) use at least one Tailwind utility class. This is concentrated in newer surfaces — the Spurs Women admin area, contact form, and a handful of individual pages.

The color palette is now exposed to Tailwind correctly (via `@theme` in `globals.css`, per the fix above), backed by the same CSS variables the hand-written CSS uses. But **most Tailwind-utility usage doesn't even attempt to use those tokens** — it uses Tailwind's generic default palette instead (`gray-800`, `yellow-50`, `red-600`...). 50 files do this.

A concrete example, `src/app/regicide/page.tsx`:
```tsx
<h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
<div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded">
  <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
```
This is a warning banner. `variables.css` already defines a full warning palette (`--warning-bg`, `--warning-accent`, `--warning-text`, `--warning-dark-bg`, `--warning-dark-border`, `--warning-dark-text`) used by the hand-written `.outdated-banner` component elsewhere on the site — but it isn't exposed to Tailwind (no `warning` group in `@theme` yet), so this page falls back to generic yellow instead of matching. (I tried adding a `warning` token as a pilot before Track 0 was fixed — see "Pilot" below. Worth redoing now that the underlying config actually works.)

## What "done" doesn't mean here

Not every `gray-600`/`gray-100` text class is a problem. Neutral body text doesn't need to be forced onto a brand token — brand colors exist for accents, interactive elements, and semantic states (warning/error/success), not for every pixel of text. The real gap is narrower and more useful than "replace all Tailwind colors": **semantic states that already have a defined brand token in `variables.css` should use it via Tailwind, instead of silently falling back to Tailwind's defaults.**

Also worth naming: there's currently no brand "error/danger" token at all (`variables.css` only defines `warning-*`). `src/app/spurs-women/admin/page.tsx:373` uses raw `bg-red-600` for what looks like a destructive-action state. Introducing a brand error color is a design decision, not a mechanical fix — out of scope for this document, flagged for a future decision.

## Recommended approach: infra fixed, then two tracks, not one big rewrite

**Track 0 — make the tokens actually work: done.** `@theme` and `@custom-variant dark` now live in `globals.css`; `tailwind.config.ts` is deleted. Verified via the compiled CSS output and in-browser across four pages, both themes — see the critical finding section above for full detail.

**Track A — token alignment (low risk, do next):** Wherever a component already uses Tailwind utilities, and a matching brand/semantic token exists (or could be trivially added from an existing CSS variable), swap the generic Tailwind color for the token. This is a find-and-replace within already-Tailwind-based files — no architecture change, no risk to the hand-written CSS system, purely a consistency fix. ~50 files, done incrementally.

**Track B — CSS-to-Tailwind migration (larger, opt-in, not started):** Actually replacing the hand-written modular CSS system (`.about-container`, `.project-card`, etc.) with Tailwind utility classes in JSX. This is a much bigger undertaking — ~150 component/page files, several thousand lines of CSS, full visual-regression risk across every breakpoint and both themes, and it would partially reverse the modular-CSS architecture `CSS_ARCHITECTURE.md` currently documents as the intended system. **Recommend not doing this as a wholesale rewrite.** If it's wanted:
- Decide explicitly whether Tailwind-utility-first should *replace* the modular CSS system as documented policy, or coexist with it for new pages only — that's a real architectural choice, not something to infer.
- If pursued, migrate one page at a time, opportunistically, when that page is already being touched for other reasons — not as a dedicated big-bang project.
- Update `CSS_ARCHITECTURE.md` to reflect whatever decision is made, so the two docs don't contradict each other.

## Pilot (attempted before Track 0 was fixed, not shipped)

Tried the obvious first step in Track A before the config bug was understood: added a `warning` color group to `tailwind.config.ts`, backed by the existing `--warning-*` variables, and pointed `regicide/page.tsx`'s maintenance banner at it instead of generic Tailwind yellow/gray. It rendered with **no background at all** (transparent) — which is how the Track 0 bugs were found. Reverted both files rather than ship a visible regression. Now that `@theme` actually works, this is a good first Track A item to redo.

## Suggested next steps

1. Redo the `warning` token pilot on `regicide/page.tsx`: add a `warning` group to the `@theme` block in `globals.css` (bg/bg-light/accent/text/dark-bg/dark-border/dark-text, mirroring the `--warning-*` variables), point the banner at it, verify against the existing `.outdated-banner` styling in both themes.
2. Sweep the remaining ~49 files using generic Tailwind palette colors; replace with `brand-*`/`spurs-*`/`dark-*` tokens where a semantic match exists.
3. Decide what to do about the "found, deliberately not fixed" items above (`spurs-gray`, `pale-green`/`third-colour`, `neutral-gray`) — each needs an actual color decision, not a mechanical fix.
4. Decide on a brand error/danger token if the red-600 admin usage should match site identity rather than stay a universal "danger" red (there's a reasonable argument either way).
5. If the cascade-layer issue (hand-written CSS beating valid Tailwind utilities on shared elements) turns out to matter beyond the one heading found so far, that's a separate, bigger piece of work — wrapping the hand-written CSS in `@layer` and re-verifying cascade order sitewide.
6. Only after Track A is done and stable, revisit whether Track B (full CSS-to-Tailwind migration) is worth doing at all.
