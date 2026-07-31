# Tailwind Adoption: Current State & Migration Plan

## Why this document exists

There's a long-standing intent to "make better use of Tailwind through the site." Two earlier attempts at this stalled and were abandoned (see git history around `refactor/tailwind-implementation` and `feature/api-documentation`, February 2026) — they tried to solve a hardcoded-color problem in `globals.css` that has since been solved a different way (see [`CSS_ARCHITECTURE.md`](CSS_ARCHITECTURE.md)). This document assesses where things actually stand today and proposes a lower-risk path forward.

## Critical finding: `tailwind.config.ts`'s color palette does nothing right now

While attempting a small pilot fix (see below), I found that **every custom color defined in `tailwind.config.ts` — `brand-*`, `spurs-*`, `dark-*` — currently generates zero CSS**, anywhere on the site. This isn't a migration nicety, it's a live bug: every existing component using one of these classes is rendering with no color applied at all (falling through to inherited/browser-default color) right now, including in production.

**Root cause:** the site is on Tailwind v4 (`@tailwindcss/postcss` + `@import "tailwindcss"` in `globals.css`), which reads theme configuration from CSS `@theme` blocks, not from a `theme.extend` object in a JS/TS config file. `tailwind.config.ts` appears to be a leftover from a pre-v4 setup that was never reconnected after the migration. I tested the documented v3-compatibility bridge — adding `@config "../../tailwind.config.ts";` to `globals.css` — and it **did not** fix it either; I confirmed by inspecting the actual compiled CSS bundle (`_next/static/chunks/[root...].css`) rather than just computed styles, and no rule for `.bg-warning-bg` (or any `brand-*`/`spurs-*`/`dark-*` utility) was present either way.

**Where this currently bites, in shipped code:**
- `src/components/London2012Layout.tsx` — `text-brand-primary-dark`, `border-brand-primary-dark` (note: also not even the class name `tailwind.config.ts` would generate — see below)
- `src/components/London2012Sidebar.tsx` — `border-brand-primary-dark`
- `src/components/admin/TabNav.tsx` — `text-spurs-dark-accent`
- `src/components/spurs-women/PodcastCard.tsx` — `text-spurs-gray`

Some of these class names (`brand-primary-dark`, `spurs-gray`) don't even match what `tailwind.config.ts` defines (`brand-dark`, no `spurs-gray` at all) — a symptom of nobody being able to notice a naming mistake, because correct and incorrect names have looked identical (both inert) since the v4 migration.

**Recommended fix (not done — needs its own verification pass):** move the color definitions out of `tailwind.config.ts` into a `@theme` block in `globals.css`, the standard Tailwind v4 pattern, e.g.:
```css
@theme {
  --color-brand-dark: var(--brand-primary-dark);
  --color-brand-light: var(--brand-primary-light);
  --color-spurs-dark: var(--spurs-primary-dark);
  --color-dark-accent: var(--dark-accent);
  /* ...etc, one --color-* per existing tailwind.config.ts entry */
}
```
This is pure CSS, so it sidesteps whatever is preventing the JS config from being picked up. Once wired up, every currently-inert `brand-*`/`spurs-*`/`dark-*` class across the site will start rendering a real color for the first time — which is the fix, but also means **every page currently using one of these classes will visibly change** (for the better, presumably, since that's what was intended — but it needs a full visual pass across all four files above, in both themes, before merging, not just the one page this document was drafted around). That's real, standalone work — recommend it as its own PR, separate from the token-alignment sweep below, since it touches production-visible rendering sitewide rather than one page.

## Current state

The site runs **two parallel styling systems** that don't talk to each other:

1. **Hand-written, modular CSS** (`src/styles/*.css` + `globals.css`), using semantic class names (`.about-container`, `.project-card`) and CSS custom properties defined in `variables.css` (`--brand-primary-dark`, `--dark-accent`, etc.). This is the majority approach — documented, consistent, and covers most of the original portfolio pages (About, Experience, Projects, 404, main theme).

2. **Tailwind utility classes**, used directly in JSX. About half the component/page files (80 of 149) use at least one Tailwind utility class. This is concentrated in newer surfaces — the Spurs Women admin area, contact form, and a handful of individual pages.

`tailwind.config.ts` was clearly *intended* to map the site's brand palette to Tailwind color tokens (`brand-dark`, `spurs-dark`, `dark-accent`, etc.), backed by the same CSS variables the hand-written CSS uses — see the critical finding above for why that mapping doesn't currently do anything. Separately from that bug, **most Tailwind-utility usage doesn't even attempt to use those tokens** — it uses Tailwind's generic default palette instead (`gray-800`, `yellow-50`, `red-600`...). 50 files do this. Even after the `@theme` fix above lands, these 50 files would still need updating to actually reference the brand tokens instead of generic colors.

A concrete example, `src/app/regicide/page.tsx`:
```tsx
<h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
<div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded">
  <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
```
This is a warning banner. `variables.css` already defines a full warning palette (`--warning-bg`, `--warning-accent`, `--warning-text`, `--warning-dark-bg`, `--warning-dark-border`, `--warning-dark-text`) used by the hand-written `.outdated-banner` component elsewhere on the site — but it isn't exposed to Tailwind, so this page fell back to generic yellow instead of matching. (I tried adding a `warning` token here as a pilot and pointing this page at it — see "Pilot" below for why that didn't ship.)

## What "done" doesn't mean here

Not every `gray-600`/`gray-100` text class is a problem. Neutral body text doesn't need to be forced onto a brand token — brand colors exist for accents, interactive elements, and semantic states (warning/error/success), not for every pixel of text. The real gap is narrower and more useful than "replace all Tailwind colors": **semantic states that already have a defined brand token in `variables.css` should use it via Tailwind, instead of silently falling back to Tailwind's defaults.**

Also worth naming: there's currently no brand "error/danger" token at all (`variables.css` only defines `warning-*`). `src/app/spurs-women/admin/page.tsx:373` uses raw `bg-red-600` for what looks like a destructive-action state. Introducing a brand error color is a design decision, not a mechanical fix — out of scope for this document, flagged for a future decision.

## Recommended approach: fix the infra, then two tracks, not one big rewrite

**Track 0 — make the tokens actually work (blocking, do first):** Migrate `tailwind.config.ts`'s color palette into a `@theme` block in `globals.css`, per the critical finding above. Everything below assumes this is done — none of it works otherwise. This needs a visual check of the four files listed above (in both themes) since they'll change appearance for the first time.

**Track A — token alignment (low risk, do after Track 0):** Wherever a component already uses Tailwind utilities, and a matching brand/semantic token exists (or could be trivially added from an existing CSS variable), swap the generic Tailwind color for the token. This is a find-and-replace within already-Tailwind-based files — no architecture change, no risk to the hand-written CSS system, purely a consistency fix. ~50 files, done incrementally.

**Track B — CSS-to-Tailwind migration (larger, opt-in, not started):** Actually replacing the hand-written modular CSS system (`.about-container`, `.project-card`, etc.) with Tailwind utility classes in JSX. This is a much bigger undertaking — ~150 component/page files, several thousand lines of CSS, full visual-regression risk across every breakpoint and both themes, and it would partially reverse the modular-CSS architecture `CSS_ARCHITECTURE.md` currently documents as the intended system. **Recommend not doing this as a wholesale rewrite.** If it's wanted:
- Decide explicitly whether Tailwind-utility-first should *replace* the modular CSS system as documented policy, or coexist with it for new pages only — that's a real architectural choice, not something to infer.
- If pursued, migrate one page at a time, opportunistically, when that page is already being touched for other reasons — not as a dedicated big-bang project.
- Update `CSS_ARCHITECTURE.md` to reflect whatever decision is made, so the two docs don't contradict each other.

## Pilot (attempted, not shipped)

Tried the obvious first step in Track A: added a `warning` color group to `tailwind.config.ts`, backed by the existing `--warning-*` variables, and pointed `regicide/page.tsx`'s maintenance banner at it instead of generic Tailwind yellow/gray. It rendered with **no background at all** (transparent) — which is how the Track 0 bug was found. Reverted both files rather than ship a visible regression. This should be redone once Track 0 is fixed, using the `@theme` pattern instead of `tailwind.config.ts`.

## Suggested next steps (not started)

1. **Track 0 first**: migrate the color palette to `@theme` in `globals.css`; verify the four already-shipped files above render correctly in both themes.
2. Redo the `warning` token pilot on `regicide/page.tsx` using the now-working `@theme` tokens; verify against the existing `.outdated-banner` styling.
3. Sweep the remaining ~49 files using generic Tailwind palette colors; replace with `brand-*`/`spurs-*`/`dark-*` tokens where a semantic match exists.
4. Decide on a brand error/danger token if the red-600 admin usage should match site identity rather than stay a universal "danger" red (there's a reasonable argument either way).
5. Only after Track A is done and stable, revisit whether Track B is worth doing at all.
