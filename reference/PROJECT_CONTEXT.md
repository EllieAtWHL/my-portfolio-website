# Project Overview

This project is the consolidation of two existing websites into a single, well-structured Next.js application.

## Project Nature

This is a personal, non-commercial project and an unofficial fan site.

While professional engineering standards and best practices are applied, decisions are intentionally balanced against:

  - Personal maintainability rather than team scale
  - Learning and experimentation
  - Low operational and cognitive overhead

As a result, some enterprise-grade tooling and processes are intentionally deferred unless they provide clear value.

## Copyright & Trademark Considerations

The Spurs Women section of this site is an unofficial fan project and is not affiliated with or endorsed by Tottenham Hotspur Football Club or any related entities.

Care must be taken to minimise the risk of copyright or trademark infringement, particularly with respect to:
  - Club logos, crests, and official branding
  - Commercial imagery or promotional assets
  - Kit designs and sponsor marks

Design and implementation guidelines:
  - Avoid use of official logos, crests, or trademarks as primary design elements.
  - Prefer original photography, personally taken images, or permissibly licensed assets.
  - Where club-related imagery appears incidentally (for example in photographs), it should be contextual and non-commercial in nature.
  - Avoid creating visuals that could be interpreted as official branding, merchandise, or marketing material.

These considerations may influence design, styling, and content decisions and should be taken into account when adding new features or visual elements.

## Background

  - I originally built my personal website using vanilla HTML, JavaScript, and CSS. The code for this lives in the `myPortfolioWebsite` repository.
  - I later built an unofficial Spurs Women website using Next.js and Tailwind CSS. The code for this lives in the `SpursWomenSite` repository.
  - I am now migrating both sites into a single Next.js and Tailwind CSS codebase.
  - The end goal is one website, where:
    - My personal site content forms the primary site.
    - The Spurs Women site lives under a dedicated sub-route (for example `/spurs-women`).
  - This is both a functional website and a learning exercise, with a strong emphasis on maintainable architecture and best practices.

## Current State

**Completed Infrastructure:**
  - ✅ Next.js project with App Router is set up and running
  - ✅ TypeScript configuration implemented
  - ✅ Tailwind CSS v4
  - ✅ Component architecture established with proper folder structure
  - ✅ Shared Button component with TypeScript variants and migration guide
  - ✅ Basic personal site pages migrated (about-me, experience, projects, contact-me, etc.)
  - ✅ Spurs Women section structure established under `/spurs-women` route
  - ✅ Supabase integration added for future data needs
  - ✅ RSS parser integration for content feeds

**Technical Implementation:**
  - ✅ Feature-based organization implemented
  - ✅ Server components used by default
  - ✅ Proper TypeScript typing throughout
  - ✅ Tailwind design tokens and CSS variables established
  - ✅ Component composition patterns in place
  - ✅ ESLint configuration for code quality

## Target Architecture

### Core Technology Stack

  - Framework: Next.js 16.2.6 (App Router)
  - Styling: Tailwind CSS v4
  - Language: TypeScript 5
  - Deployment: Vercel (or equivalent static-first hosting)
  - Package management: npm
  - Additional: Supabase for data, RSS Parser for content feeds

### High-Level Structure

  - A single Next.js application.
  - Feature-based organisation rather than page-based sprawl.
  - Clear separation between:
    - Shared, global components and styles.
    - Personal site features.
    - Spurs Women–specific features.

Example (conceptual) structure:

```
app/
  layout.tsx
  page.tsx
  spurs-women/
    layout.tsx
    page.tsx

components/
  ui/
  layout/
  navigation/

features/
  personal/
  spurs-women/

lib/
  constants/
  utils/

styles/
  globals.css
```

## Requirements

### Functional Requirements

  - Fully responsive and mobile-friendly.
  - Clean navigation between the personal site and the Spurs Women section.
  - Spurs Women content must be clearly scoped and not leak into the personal site unintentionally.
  - Existing content from both sites must be preserved.

### Non-Functional Requirements

  - Built using Next.js and Tailwind CSS only.
  - Use TypeScript everywhere.
  - Follow modern React and Next.js best practices.
  - Avoid hacks, one-off overrides, or brittle workarounds.
  - Optimise for readability and long-term maintainability over speed of delivery.

## Design & Styling Principles

  - Tailwind CSS is the primary styling mechanism.
  - No inline styles unless absolutely unavoidable.
  - **ALWAYS use CSS variables (via Tailwind config and `:root`) for colors - never hardcode color values in CSS**
  - Use CSS variables for:
    - Colours (mandatory - no hardcoded hex values)
    - Spacing where appropriate
    - Font decisions
  - **CSS Variable Limitation**: CSS variables cannot be used with `rgba()` functions for opacity (e.g., `rgba(var(--color), 0.2)` is invalid CSS). When transparency is needed, either:
    - Use hardcoded RGB values with opacity (e.g., `rgba(120, 190, 232, 0.2)`)
    - Create separate CSS variables for transparent versions
    - Use opacity CSS properties instead of rgba values
  - Design tokens should be defined once and reused.
  - Components should be flexible and configurable rather than duplicated.

The personal site and Spurs Women section may have different visual identities, but they should still share:
  - Layout primitives
  - Typography scales
  - Spacing conventions

## Component Architecture

  - Components should be small, focused, and composable.
  - Prefer composition over inheritance.
  - Shared components live outside feature folders.
  - Feature-specific components live within their feature boundary.

Guiding principles:
  - No hard-coded text inside reusable components.
  - Props should be explicit and typed.
  - Components should not assume routing context unless they are route-level components.

## Routing & Navigation

  - Use the Next.js App Router exclusively.
  - `/` and related routes belong to the personal site.
  - `/spurs-women` and sub-routes belong to the Spurs Women site.
  - Use nested layouts to:
    - Share global navigation and metadata.
    - Allow the Spurs Women section to override layout elements if needed.
  - Navigation should feel seamless but clearly indicate which section the user is in.

## State & Data Management

  - Prefer server components by default.
  - Use client components only where interaction or browser APIs are required.
  - Avoid global state unless absolutely necessary.
  - If shared state is needed, prefer:
    - URL state
    - Props
    - Server-derived data
  - Any future data sources (for example Supabase) should be abstracted behind a small data access layer.

## Migration Strategy

**Completed Phases:**
  - ✅ New Next.js project setup with TypeScript and Tailwind CSS
  - ✅ Global styles, layout, and navigation established
  - ✅ Basic personal site pages migrated (about-me, experience, projects, contact-me, etc.)
  - ✅ Spurs Women site structure established under `/spurs-women`
  - ✅ Shared component system foundation (Button component with variants)
  - ✅ Design token system and CSS variables established

## Testing Strategy

  - Comprehensive automated testing is now standard practice.
  - Primary emphasis on:
    - Unit tests for all new components and utilities
    - Component testing with React Testing Library
    - TypeScript for compile-time correctness
    - Jest for test runner and coverage
  - **MANDATORY**: All new components and utilities must include tests
  - Coverage targets: Aim for >90% coverage on new code
  - Manual testing still important for integration flows

### Testing Requirements for New Development

**All new features MUST include:**
1. **Unit Tests** - For utility functions and pure logic
2. **Component Tests** - For React components using React Testing Library
3. **Edge Case Testing** - Error states, missing props, invalid inputs
4. **Accessibility Testing** - ARIA labels, semantic structure
5. **TypeScript Coverage** - Proper typing for all new code
6. **Mutation Testing** - Applied to new/changed tests to ensure they are robust and meaningful

**Test File Organization:**
- Place tests in `__tests__` directories alongside source code
- Follow naming convention: `ComponentName.test.tsx` or `utilityName.test.ts`
- Use descriptive test names that explain the behavior
- Group related tests with `describe` blocks

**Quality Standards:**
- Tests must pass before deployment (CI/CD gate)
- New code should not reduce overall test coverage
- Tests should be maintainable and easy to understand
- Use proper assertions and avoid brittle selectors

## Performance & Optimisation

  - Prefer static rendering where possible.
  - Use Next.js image optimisation for all images.
  - Avoid unnecessary client-side JavaScript.
  - Monitor bundle size and component boundaries.
  - Performance decisions should be intentional and documented.

## Development Principles

  - Clarity over cleverness.
  - Explicit is better than implicit.
  - Prefer boring, well-understood solutions.
  - Treat this codebase as something that will be returned to in years, not weeks.

## Technical Decisions
### Error Handling & Error Boundaries

Decision (revised 2026-08, WEB-63/WEB-44):
  - Use Next.js route-level `error.tsx` and `not-found.tsx` files as the primary boundary mechanism - still no bespoke React error-boundary abstraction layered on top of Next's own.
  - Errors should fail loudly in development and degrade gracefully in production.
  - Centralised error logging, user-facing error messaging, retry handling for flaky external fetches, and basic offline awareness are now in scope (previously deferred) - tracked as a set of separately-sized issues under epic WEB-44 rather than one large ticket, so each can be reviewed and shipped independently.

Approach:
  - Add `error.tsx` per route group with real data dependencies (especially under `/spurs-women`, where fetches to Supabase/YouTube/RSS can fail) rather than only "where needed" ad hoc - the original wording undersold how many routes already fetch external data.
  - Activate the existing-but-unused `trackError()` helper in `src/lib/fullstory.ts` from client-rendered code (error boundaries) instead of leaving errors in `console.error` only. FullStory here is a browser-only session-recording snippet (`window.FS`, no server SDK/API key) - `trackError()` is a guaranteed no-op anywhere it's called server-side (API route handlers, `cache-utils.ts`), so it's deliberately *not* called from those, to avoid shipping dead code that looks like it's tracking errors while doing nothing. Server-side errors remain `console.error`-only for now; a real server-side error-tracking integration would be separate, larger scope than reactivating this helper. This doesn't require new infrastructure or CSP changes - FullStory's hosts are already allowlisted.
  - Replace silent-failure patterns in client-fetching components (e.g. `MatchesClient`, `MediaGallery`, `TeamClient`, `StadiumClient`) that currently catch, log, and render the same empty state as genuine no-data, with a visible, reusable `ErrorState` component - a fetch failure should look different from "no data exists."
  - Add retry-with-backoff to outbound fetches most likely to hit transient failures: the external proxy routes (`spurs-women-news`, `spurs-women-videos`, `podcasts`) and their underlying `src/lib/data/*.ts` fetchers.
  - Offline functionality is scoped narrowly: a service worker/manifest sufficient for basic offline awareness (e.g. a cached fallback page, `navigator.onLine`-driven messaging), not full PWA installability/asset precaching - this is a personal site, not an app users expect to work offline-first.
  - Avoid try/catch in components unless handling a known failure case; prefer clear error states over silent fallbacks.

Current state:
  - `src/app/not-found.tsx` exists and is in use. `src/app/spurs-women/error.tsx` (WEB-96) is the first `error.tsx` boundary in the codebase - it sits above every `/spurs-women` route (matches, players, teams, stadiums, seasons, admin, etc.), so a single file catches thrown errors anywhere in that subtree via Next.js's nested-boundary behaviour. No `error.tsx` exists at the root or under core-site routes yet, since none of them have a data dependency that would throw.
  - `trackError()` (WEB-97) is now called from `src/app/spurs-women/error.tsx`, the one place it can actually reach FullStory (client-rendered). It's deliberately not called from API routes or `cache-utils.ts`'s `CacheError` path, since both run server-side where `trackError()` no-ops - server-side errors are still `console.error`-only.
  - `src/components/ErrorState.tsx` (WEB-98) is the shared error-state component; `MatchesClient`, `MediaGallery`, `TeamClient`, and `StadiumClient` use it instead of silently rendering an empty/no-data state on fetch failure. `src/lib/data/client.ts` - the client-side fetcher module the original WEB-63 audit flagged - turned out to be dead code (zero callers besides its own test) once investigated, so it was deleted rather than "fixed."
  - `src/lib/retry.ts` (WEB-99) provides `retryWithBackoff()`, wrapping the outbound RSS/YouTube fetches in `src/lib/rss.ts` and the podcast RSS fetch in `src/lib/data/news.ts` - the external proxy routes (`spurs-women-news`, `spurs-women-videos`, `podcasts`) inherit it automatically since they call these same data-layer functions rather than fetching directly. Bounded at 3 attempts with exponential backoff by default; doesn't touch `src/lib/rate-limit.ts` (inbound) at all.
  - `public/sw.js` (WEB-100) is a minimal service worker that precaches exactly one file, `public/offline.html` (a self-contained static page, no JS/CSS dependencies), and serves it only for failed navigation requests - everything else (assets, API calls) passes straight through, untouched. Registered client-side by `src/components/ServiceWorkerRegistration.tsx`, production builds only (a dev-registered SW fights Next's own hot-reloading). `src/components/OfflineBanner.tsx` shows a fixed, site-wide banner via `useSyncExternalStore` subscribed to the browser's `online`/`offline` events - fixed positioning (`z-[200]`, matching `SkipLink`'s convention) is required because the core site's navbar is itself `position: fixed` (`z-index: 100` in `main-theme.css`), so a normal in-flow banner would render correctly in the DOM but sit invisibly behind it.

Why this fits the project:
  - Next.js primitives remain the foundation; this adds the logging/UX/resilience layer on top rather than replacing them.
  - Splitting into smaller issues keeps each change reviewable despite the combined scope being larger than the original "keep complexity low" stance assumed.
  - Still deliberately excludes a custom error-boundary abstraction and full offline-first/installable PWA behaviour - out of proportion for a personal site without SLAs.

### Internationalisation / Localisation (i18n)

Decision:
  - No internationalisation or localisation at MVP.
  - Site is English-only.

Rationale:
  - Content is personal and UK-centric.
  - No strong user need for multiple languages.
  - Introducing i18n adds significant complexity (routing, content duplication).

Future stance:
  - If needed later, use Next.js built-in i18n routing or a lightweight library.
  - Content should avoid hard-coding locale assumptions where easy to avoid.

### Image Optimisation Beyond Next.js Defaults

Decision:
  - Use next/image everywhere possible.
  - Rely on Next.js defaults for formats, lazy loading, and responsive sizing.
  - No custom image CDN logic beyond what Vercel provides.

Additional conventions:
  - Always specify sizes for responsive images.
  - Prefer static imports for local images.
  - Spurs Women media should be optimised at source where possible.

Why this fits:
  - Next.js already solves 90% of the problem.
  - Avoids premature optimisation.

## Content Strategy
### CMS for Content Management

Decision:
  - No CMS at MVP.
  - Content is managed in-code or via Supabase where data-driven.

Rationale:
  - This is a personal and fan site.
  - CMS overhead outweighs benefits initially.
  - Git-based content is acceptable and transparent.

Future options (explicitly optional):
  - Headless CMS (Sanity, Contentful) only if content volume grows significantly.
  - Supabase tables for structured data (matches, players, results).

### Blog Posts & Dynamic Content

Decision:
  - Blog-style content handled via:
    - Static Markdown (if needed), or
    - Supabase-backed content for structured feeds (already partially implemented via RSS).

Approach:
  - Prefer static generation.
  - Avoid building a full blogging engine unless genuinely required.

### SEO Optimisation

Decision:
  - Use Next.js metadata API.
  - Manual, intentional SEO rather than automation-heavy tooling.

Scope:
  - Page-level titles and descriptions.
  - Open Graph metadata for key pages.
  - Semantic HTML.
  - Sitemap and robots.txt if/when useful.

Explicitly out of scope:
  - Advanced keyword tracking
  - A/B testing
  - SEO dashboards

This is appropriate for a fan site.

## Development Workflow
### Git Commands & File Handling

**Important Note for Files with Square Brackets:**
When working with Next.js dynamic routes that contain square brackets (e.g., `[matchId]`, `[seasonId]`), always wrap the file path in quotes when using git commands:

```bash
# ✅ Correct - with quotes
git add "src/app/spurs-women/matches/[matchId]/page.tsx"
git add "src/app/spurs-women/seasons/[seasonId]/page.tsx"

# ❌ Incorrect - without quotes (shell interprets brackets as pattern matching)
git add src/app/spurs-women/matches/[matchId]/page.tsx
```

This prevents the shell from interpreting the square brackets as pattern matching characters and ensures the correct files are staged.

### Automated Testing

Decision (superseded):
  - This section originally decided against automated testing at MVP, relying on TypeScript + manual testing.
  - That decision no longer holds: Jest + React Testing Library are now installed and automated testing is mandatory for new components/utilities (see "Testing Strategy" above and `reference/testing/README.md`).

Current state:
  - E2E testing with Playwright is now implemented: 13 spec files under `tests/` (personal-site pages, `tests/accessibility.spec.ts`, plus `tests/spurs-women/*`), run via `npx playwright test` and in CI via `.github/workflows/playwright.yml` across chromium/firefox/webkit.

### Deployment Pipeline

Decision:
  - Direct deployment via Vercel.
  - Git-based deploys from main branch.
  - A lightweight GitHub Actions CI setup now exists: `.github/workflows/ci.yml` runs lint, typecheck, the Jest suite + coverage, and a production build (as separate jobs) on push/PR to main; `.github/workflows/playwright.yml` runs the Playwright E2E suite across chromium/firefox/webkit; `.github/workflows/validate-manifest.yml` regenerates and validates the photo manifest (it does not run a production build - that's covered by `ci.yml`'s `build` job). None of these gate the Vercel deploy itself - still no staged/enterprise-grade pipeline.

Rationale:
  - Solo developer
  - Low-risk changes
  - Easy rollback via Vercel

### Environment Configuration

Decision:
  - Environment variables managed via:
    - .env.local for development
    - Vercel environment variables for production
  - No custom config abstraction.

Rules:
  - No secrets committed to the repo.
  - Public vs server-only variables clearly separated.

### Database Connection Pooling (WEB-61)

Decision:
  - No app-managed Postgres connection pool, and none is needed.

Rationale:
  - All database access goes through `@supabase/supabase-js` and `@supabase/ssr`
    (see `src/lib/supabase/`), which talk to Supabase's PostgREST API over HTTP -
    the app never opens a raw Postgres connection to pool in the first place.
  - Supabase's own infrastructure (Supavisor) already pools connections between
    PostgREST and Postgres on Supabase's side; this is confirmed by the
    `pooler-url` entry the Supabase CLI caches for the linked project.
  - Raised during the WEB-61 "database optimization" investigation, which found
    the original ticket's "add database connection pooling" item didn't map onto
    this architecture - documented here rather than left as an open question to
    re-investigate later.

### Database Schema Management (WEB-135)

Decision:
  - The Postgres schema is now tracked in git as SQL migration files under
    `supabase/migrations/`, applied via the Supabase CLI. This reverses the
    prior practice (schema managed entirely via the Supabase dashboard, with
    no record of it anywhere in the repo).

Workflow going forward:
  - New schema change: `supabase migration new <name>` creates an empty
    timestamped file in `supabase/migrations/`; write the SQL by hand; open a
    PR as normal. Once merged to `main`, the **GitHub integration** (below)
    applies it automatically - no manual `supabase db push` needed for the
    normal case. `db push` still works directly from the CLI too (used
    throughout WEB-61/135/136 before the integration existed, and still the
    right tool for testing a migration against the linked project - currently
    the production "Spurs Women" project, there is no separate staging
    project - before it's merged).
  - This loop (`migration new` -> hand-write SQL -> merge, or `db push`) does
    **not** require Docker.
  - Make schema changes through a migration file, not the Supabase dashboard
    directly, so this stays an accurate record. If a change does happen via
    the dashboard, reconciling it back into a migration file needs
    `supabase db pull`/`db diff` (see below).

GitHub integration (WEB-137):
  - Connected via the Supabase dashboard (Project Settings -> Integrations ->
    GitHub), pointing at this repo with "Deploy to production" enabled. On
    every push/merge to `main`, Supabase runs any migrations in
    `supabase/migrations/` that haven't already been applied - the same
    effect as running `supabase db push` by hand, just automatic.
  - This is a free-tier feature (available on any plan) - **not** to be
    confused with Supabase Branching (ephemeral per-PR preview databases),
    which requires the Pro plan plus metered per-branch-hour cost on top and
    is deliberately not enabled here; not worth it at this project's scale.
    Only the "deploy migrations to production on merge" half of the GitHub
    integration is turned on.
  - Trade-off worth knowing: this removes the manual confirmation step that
    existed between "PR merged" and "migration actually applied to
    production" (previously a separate `db push` requiring explicit
    approval). The review gate is now the PR merge itself - be as careful
    merging a migration-containing PR as you would running `db push`
    directly, since it'll apply within moments of landing on `main`.
  - `supabase/config.toml` (added for this) is deliberately trimmed from
    `supabase init`'s ~385-line default - the full default scaffolds local
    dev stack settings (auth email templates, storage buckets, Edge
    Functions, Studio, Inbucket) for `supabase start`, which this project
    never runs (no Docker). Kept: `project_id` and `[db.migrations]` only -
    what the CLI/integration actually need.

Docker dependency:
  - `supabase db pull` and `supabase db diff` **do** require Docker (they run
    a temporary shadow Postgres instance to diff schemas) - this machine
    doesn't have Docker installed, and installing Docker Desktop was judged
    not worth it for a project at this scale.
  - These two commands are only needed to reconcile schema drift (a change
    made outside a migration file) or to regenerate a full baseline from
    scratch - not for the normal add-a-migration loop above.
  - Workaround used to seed the initial baseline without Docker:
    `supabase db dump --dry-run` prints the exact `pg_dump` command and
    temporary scoped credentials the CLI would otherwise run inside Docker;
    running that command directly against a locally-installed `pg_dump`
    (`brew install libpq`, keg-only - binaries are under
    `$(brew --prefix libpq)/bin`, not on `PATH` by default) produces the same
    output without Docker. The resulting file was then registered as already
    applied with `supabase migration repair --status applied <version>`
    (since it captures existing state, not a change to run).

Current state:
  - `supabase/migrations/20260826173645_add_matches_fk_indexes.sql` (WEB-61) -
    the first migration, adding indexes on `matches.home_team_id`,
    `matches.away_team_id`, `matches.stadium_id`.
  - `supabase/migrations/20260826175328_baseline_schema.sql` (WEB-135) - a
    full schema-only dump of every table/column/constraint/index/view in the
    `public` schema at that point, captured via the `pg_dump` workaround
    above. Treat this as a point-in-time baseline, not a live mirror - it
    will drift from the real schema as new migrations are added on top, the
    same way any snapshot does.
  - For field-level documentation of what each table/column means (not just
    its DDL), see `reference/spurs-women/admin/ADMIN_SYSTEM_DOCUMENTATION.md`'s
    "Data Entities" section - that doc explains purpose and usage, the
    migrations are the authoritative source for exact structure.

Rationale:
  - Recreatability (rebuilding the schema from the repo alone, without
    depending on Supabase's dashboard/backups) is itself a form of backup,
    and came up during the WEB-61 database-optimization investigation as a
    cheap, code-only complement to whatever Supabase-side backup/PITR
    settings the project ends up using (tracked separately in WEB-135).
  - A real migrations workflow is a bigger commitment than a one-off fix,
    but was judged worth it for a project with zero prior schema history -
    the alternative was staying at zero indefinitely.

## Performance & Monitoring
### Performance Monitoring (Core Web Vitals)

Decision:
  - No dedicated performance monitoring tooling at MVP.
  - Rely on:
    - Next.js build output
    - Browser dev tools
    - Vercel analytics if enabled

Future option:
  - Add Vercel Web Analytics if performance becomes a concern.

### Bundle Size Budget & Monitoring

Decision:
  - No formal bundle size budget.
  - Manual awareness only.

Practices:
  - Avoid unnecessary dependencies.
  - Prefer native APIs and framework features.
  - Review large imports deliberately.

### Analytics & User Tracking

Current state (this superseded the original MVP-era "minimal or no
analytics" plan below it - kept for the rationale, not as a description of
what's actually running):
  - **FullStory** (session recording) and **Vercel Analytics** are both in
    use - see `reference/fullstory/README.md`.
  - **Google reCAPTCHA** on the contact form additionally sets a third-party
    cookie.
  - All three are gated behind an explicit cookie consent banner (WEB-102) -
    none of them load until a visitor accepts. See
    `reference/COOKIE_CONSENT.md` for the full consent architecture.

Original MVP decision (superseded by the above):
  - Minimal or no analytics initially.
  - If added, privacy-conscious and lightweight.
  - No behavioural tracking, no third-party ad/tracking pixels.

Rationale (still holds - now honored via consent-gating rather than by not
tracking at all):
  - Fan site
  - Personal project
  - Respect user privacy

## Open Questions

**Resolved:**
  - ✅ Supabase integration added for future data needs
  - ✅ RSS parser integrated for content feeds
  - ✅ Component architecture established with TypeScript
  - ✅ E2E testing automation approach settled on Playwright (see "Automated Testing" above)

## Explicit Non-Goals (for Now)
The following are intentionally out of scope for MVP:
  - Multi-language support
  - Enterprise-grade CI/CD pipelines (a lightweight GitHub Actions test/build check does exist - see Deployment Pipeline above - but there's no staged/gated deployment pipeline)
  - Advanced analytics or tracking
  - Full CMS integration
  - Automated testing - NOW IMPLEMENTED (see Testing Strategy above)

These may be revisited only if the project’s scope or audience changes significantly.

---

## Photo Gallery Manifest Workflow

### Overview

The Spurs Women photo gallery uses an external repository (`spurs-women-photo-gallery`) to store images, with an automated manifest generation system to make those images available to the main website.

### Architecture

**Two-Repository System:**
1. **External Photo Repository** (`spurs-women-photo-gallery`): Contains all image files organized by match/season
2. **Main Website Repository** (`my-portfolio-website`): Contains a generated manifest file with CDN URLs

**Manifest File:** `public/spurs-women/photo-gallery.manifest.json`

### Automated Workflow

**GitHub Action (External Repo):**
- **Trigger**: When image files are pushed to `spurs-women-photo-gallery` main branch
- **Action**: `.github/workflows/update-manifest.yml`
- **Process**:
  1. Checks out both repositories
  2. Runs `npm run generate-external-manifest` in main repo
  3. Generates manifest with CDN URLs for all images
  4. Commits and pushes manifest to `my-portfolio-website` main branch

**Local Development:**
- **Commit Hook**: Automatically runs `generate-external-manifest` when committing changes
- **Purpose**: Ensures local development has latest manifest
- **Note**: This is a backup mechanism - primary updates should come from GitHub Action

### Common Scenarios & Solutions

#### Scenario 1: "Manifest shows as modified locally after adding photos"
**Cause**: GitHub Action updated manifest remotely, but local repo hasn't pulled latest changes
**Timeline**:
1. Photos added to external repo → GitHub Action triggers
2. GitHub Action generates and pushes manifest to remote main
3. Local repo still has old manifest version
4. Git shows local changes when you try to pull

**Solution**:
```bash
# Discard local changes (they're duplicates of remote changes)
git restore public/spurs-women/photo-gallery.manifest.json
# Pull latest remote changes
git pull origin main
```

#### Scenario 2: "Why does my local commit regenerate the manifest?"
**Cause**: Commit hook runs `generate-external-manifest` for any commit
**Expected Behavior**: This is normal - it's a backup mechanism
**When to Worry**: Only if the manifest content is actually different from remote

#### Scenario 3: "GitHub Action failed to update manifest"
**Troubleshooting**:
1. Check Actions tab in `spurs-women-photo-gallery` repo
2. Verify `PORTFOLIO_REPO_TOKEN` secret is configured
3. Check for API rate limits or authentication issues
4. Manual fallback: Run `npm run generate-external-manifest` locally and commit

### Best Practices

**When Adding Photos:**
1. Add images to `spurs-women-photo-gallery` repo
2. Commit and push to main branch
3. GitHub Action will automatically update manifest
4. Pull latest changes in main website repo if needed

**When Working on Main Website:**
1. Don't manually edit the manifest file
2. If Git shows manifest changes, check if GitHub Action already updated remote
3. Use `git restore` + `git pull` to sync with remote version
4. Only commit manifest changes if GitHub Action failed

**Verification:**
- Manifest should contain all folders from external repo
- Total image count should match external repo
- URLs should use CDN format: `https://cdn.jsdelivr.net/gh/EllieAtWHL/spurs-women-photo-gallery@main/...`

### File Structure

**External Repo Structure:**
```
spurs-women-photo-gallery/
├── 2023-24/
│   └── 20231216 WSL Spurs vs Arsenal/
│       ├── PXL_20231216_080505678.webp
│       └── ...
├── 2024-25/
└── 2025-26/
```

**Generated Manifest Structure:**
```json
{
  "2023-24/20231216 WSL Spurs vs Arsenal": [
    "https://cdn.jsdelivr.net/gh/EllieAtWHL/spurs-women-photo-gallery@main/2023-24/20231216 WSL Spurs vs Arsenal/PXL_20231216_080505678.webp",
    "..."
  ]
}
```

### Troubleshooting Checklist

**If manifest seems outdated:**
1. Check external repo for new images
2. Verify GitHub Action ran successfully
3. Pull latest changes in main repo
4. Run `npm run generate-external-manifest` locally if needed

**If Git conflicts occur:**
1. Check if GitHub Action already pushed updates
2. Use `git restore` to discard local duplicates
3. Pull remote changes with `git pull`

**If images don't load:**
1. Verify CDN URLs are accessible
2. Check external repo structure matches manifest keys
3. Ensure image files exist in external repo

---

## Related Documentation

This document covers architecture, technical decisions, and project boundaries.
For implementation detail on specific systems, see:

- **CSS conventions**: `reference/CSS_ARCHITECTURE.md`
- **Button component migration status**: `reference/BUTTON_MIGRATION.md`
- **Update banner component**: `reference/UPDATE_BANNER_MANAGEMENT.md`
- **Admin related-lists config**: `reference/RELATED_LISTS_CONFIGURATION.md`
- **Testing**: `reference/testing/README.md`
- **FullStory analytics**: `reference/fullstory/README.md`
- **Photo gallery system**: `reference/photo-gallery/README.md`
- **Spurs Women site overview**: `reference/spurs-women/README.md`
- **Spurs Women caching**: `reference/spurs-women/cache/README.md`
- **Spurs Women admin system**: `reference/spurs-women/admin/ADMIN_SYSTEM_DOCUMENTATION.md`
- **Public API reference**: `reference/spurs-women/api/API_DOCUMENTATION.md` (see also `reference/spurs-women/api/openapi-spec.yaml`)

The backlog/TODO list lives in Jira, not in this repo - see the "Jira is the source of truth" section in CLAUDE.md. The `WEB` project covers both the core site (`core-site` label) and Spurs Women (`spurs-women` label), with epics labeled both where work spans the whole site.

Known open tech debt at time of writing: Button migration is incomplete (13
files still render raw `<button>` elements outside the shared component - see
BUTTON_MIGRATION.md for the current list), and cache hit-rate monitoring/
metrics collection has not been implemented (see the Technical Debt & Performance epic in Jira).

This document should be used by both humans and AI as the source of truth for architectural intent. If code and documentation disagree, the documentation should be updated deliberately rather than ignored.
