# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Nature

This is a personal, non-commercial Next.js site that consolidates Ellie's personal portfolio with an **unofficial** Spurs Women (Tottenham Hotspur Women's football) fan site into one app. It's built to professional standards but deliberately scoped for solo maintainability over enterprise process — see `reference/PROJECT_CONTEXT.md` for the full rationale and the list of explicit non-goals (no i18n, no CMS, no gated deploy pipeline, etc.).

**Read `reference/PROJECT_CONTEXT.md` first** for architecture and technical decisions — it and `reference/README.md` (the doc index) are the source of truth for this repo. If code and docs disagree, update the docs deliberately rather than leaving the mismatch. Docs describe current, living behavior; completed migration plans and one-off bug write-ups are deleted once superseded, not archived.

Because the Spurs Women section is an unofficial fan site: avoid using official club logos/crests/branding as primary design elements, prefer original or licensed imagery, and don't create visuals that could read as official merchandise or marketing material.

## Working conventions

When reviewing or fixing something in this repo, proactively flag **and fix** related issues you notice along the way (hardcoded colors instead of CSS variables, dead code, inline-style workarounds for cascade bugs, etc.) rather than only addressing what was explicitly asked about. Don't just note a problem and move on to something else without acting on it.

## Commands

```bash
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Production build
npm run lint                   # ESLint
npm run typecheck              # tsc --noEmit
npm test                       # Jest, run once
npm run test:watch             # Jest watch mode
npm run test:coverage          # Jest with coverage (enforces thresholds in jest.config.js)
npx playwright test            # E2E suite (chromium/firefox/webkit; auto-starts dev server)
```

Run a single Jest test file: `npx jest path/to/file.test.tsx`. Run a single Playwright spec: `npx playwright test tests/home.spec.ts`.

Other scripts (see `package.json`): `migrate-storage[:dry-run]`, `generate-external-manifest[:help]`, `init-external-local`, `validate-manifest` — all photo-gallery/storage-manifest tooling, documented in `reference/photo-gallery/README.md`.

**Square-bracket routes**: quote paths in git commands for dynamic route files, e.g. `git add "src/app/spurs-women/matches/[matchId]/page.tsx"` — otherwise the shell treats `[matchId]` as a glob.

## CI

`.github/workflows/ci.yml` runs lint, typecheck, Jest+coverage, and a production build as separate jobs on PRs/pushes to `main`/`develop`. `.github/workflows/playwright.yml` runs the E2E suite. `.github/workflows/validate-manifest.yml` regenerates/validates the photo manifest. None of these gate the actual Vercel deploy (git-push-to-deploy from `main`).

## Architecture

### Two sections, one app
- `/` and siblings (`about-me`, `experience`, `projects`, `contact-me`, `london-2012`, `regicide`, `lightning-rollout`, etc.) — the personal site.
- `/spurs-women` and everything under it — the fan site, with its own layout, theme CSS, and data layer. See `reference/spurs-women/README.md` for its full page/component/schema map.

Server components are the default; client components (`'use client'`) only where interaction or browser APIs are required. Nested layouts share global nav/metadata while letting `/spurs-women` override.

### Data access layer (Spurs Women)
All Supabase/RSS/YouTube fetching goes through `src/lib/data/` (re-exported via `src/lib/data/index.ts`), organized by entity: `matches.ts`, `seasons.ts`, `teams.ts`, `stadiums.ts`, `players.ts`, `news.ts`. **Pages and components never fetch data directly.** Caching lives here too (`cache-utils.ts`, `cache-server.ts`, `cache-invalidation.ts`), built on Next.js `unstable_cache` with tag-based invalidation — TTLs and cache-key conventions are in `reference/spurs-women/cache/README.md`. Cache failures fall back to a direct DB fetch and throw a descriptive `CacheError` if both fail (never silently return an empty array).

Database is Supabase/Postgres; core tables are `matches`, `teams`, `seasons`, `competitions`, `stadia`, `stadium_names`, `players`, `player_history`, `player_stats`, `media` — full field-level schema in `reference/spurs-women/admin/ADMIN_SYSTEM_DOCUMENTATION.md`.

### Admin system (`/spurs-women/admin`)
Supabase Auth, authorization restricted to a single email (`ADMIN_EMAIL` env var), checked server-side in every `src/app/api/admin/*/route.ts` handler (which use the Supabase **service role** client to bypass RLS — never expose that client to non-admin-checked code paths).

The admin page was decomposed from one ~3,100-line file into:
- `src/types/spurs-women-admin.ts` — shared entity types
- `src/hooks/useSearchPagination.ts` — generic search+pagination
- `src/hooks/admin/{useMatchesAdmin,useTeamsAdmin,usePlayersAdmin,useStadiumsAdmin,usePlayerStatsModal}.ts` — per-entity state/CRUD; `usePlayerStatsModal` is separate because that modal is opened from both the matches and players tabs (the trickiest cross-hook wiring point — see the "adds player stats to a player" test in `page.test.tsx`)
- `src/components/admin/tables/*` — thin per-entity wrappers around shared `DataTable.tsx`
- `src/components/admin/modals/*` — thin per-entity wrappers around shared `FormModal.tsx`
- `src/components/admin/RelatedList.tsx` — deliberately *not* merged onto `DataTable` despite similar-looking table rendering; it needs an optional `render` with an unsafe-cast fallback that `DataTable` intentionally doesn't support. Don't "simplify" these into one component — see the architecture doc for the full reasoning.

Match score/stat fields must be saved as `null` when blank, never `0` — a blank and a genuine zero are semantically different (`matches.ts` filters on `spurs_score is null` to detect unscored fixtures). Always build match payloads via `buildMatchPayload` in `src/lib/admin-match-payload.ts` rather than constructing them inline.

### Styling
Modular CSS under `src/styles/` (not one monolithic `globals.css`) — `variables.css` (CSS custom properties), `main-theme.css` (global/shared: buttons, navbar, footer, page headers — only for styles used on 3+ pages), and one file per page/section (`about-me.css`, `experience.css`, `projects.css`, `blog.css`, `spurs-theme.css`, `not-found.css`). `spurs-theme.css` is imported by `src/app/spurs-women/layout.tsx` directly, not by `globals.css`, so it only loads for that route tree. Full conventions, anti-patterns, and dark-mode/responsive patterns are in `reference/CSS_ARCHITECTURE.md` — read it before adding styles.

Rules worth internalizing: colors always via CSS variables (never hardcoded hex — note `rgba()` can't consume a CSS variable, so transparent variants need their own variable or plain `opacity`), no `!important` unless unavoidable, page-specific styles never go in `main-theme.css` and vice versa.

There's also a shared `Button` component; some raw `<button>` elements remain unmigrated — check `reference/BUTTON_MIGRATION.md` for the current list before assuming a bare `<button>` is intentional.

### Testing
Jest + React Testing Library for unit/component tests (`__tests__/` directories colocated with source, `ComponentName.test.tsx` / `utilityName.test.ts`), Playwright for E2E (`tests/*.spec.ts` and `tests/spurs-women/*`). New components/utilities are expected to include tests. `jest.config.js` enforces coverage floors via `test:coverage` (not plain `npm test`) — set a bit below the current baseline so they catch real regressions without being fragile; raise them as coverage improves, never lower them to unblock a PR. API routes are not covered by Jest (Next.js App Router server-side fetch/Request mocking is impractical here) — they're exercised by the Playwright suite and manual testing instead. Full current coverage breakdown and known gaps: `reference/testing/README.md`.

### Path alias
`@/*` maps to `src/*` (see `tsconfig.json`).
