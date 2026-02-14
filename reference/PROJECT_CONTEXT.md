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
  - ✅ Tailwind CSS v4 with extensive configuration (7832 lines in config)
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

**Major Migration Work Remaining:**
  - **Personal Site:** Regicide game needs complete rebuild (currently non-functional)
  - **Personal Site:** Lightning rollout demo pages need migration
  - **Spurs Women:** Large amount of content and features still need migration
  - **Component Consistency:** Button migration and other component standardization
  - **Performance:** Optimization and bundle analysis needed

## Target Architecture

### Core Technology Stack

  - Framework: Next.js 16.1.1 (App Router)
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

**Current Phase:**
  - **Personal Site:** Complete Regicide game rebuild (currently non-functional)
  - **Personal Site:** Lightning rollout demo pages migration
  - **Spurs Women:** Major content and feature migration
  - **Component Consistency:** Button migration and component standardization

**Future Phases:**
  - Performance optimization and bundle analysis
  - Testing strategy implementation
  - Documentation and deployment setup

## Testing Strategy

  - Focus on confidence rather than coverage.
  - Primary emphasis on:
    - Manual testing during development.
    - TypeScript for correctness.
  - Introduce lightweight tooling if needed later (for example Playwright for key flows).
  - No over-engineering of tests at this stage.

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

Decision:
  - Use Next.js route-level error.tsx and not-found.tsx files.
  - No global custom error boundary abstraction at this stage.
  - Errors should fail loudly in development and degrade gracefully in production.

Approach:
  - Let server errors surface naturally via Next.js error handling.
  - Use error.tsx per route group (especially under /spurs-women) where needed.
  - Avoid try/catch in components unless handling a known failure case.
  - Prefer clear error states over silent fallbacks.

Why this fits the project:
  - Next.js already provides strong primitives.
  - Keeps complexity low.
  - Appropriate for a personal site without SLAs.

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

Decision:
  - No automated testing at MVP.
  - TypeScript + manual testing provide sufficient confidence.

Future stance:
  - Introduce Playwright for:
    - Navigation sanity checks
    - Key flows (home → Spurs Women → match page)
  - No unit testing framework planned unless complexity increases.

### Deployment Pipeline

Decision:
  - Direct deployment via Vercel.
  - Git-based deploys from main branch.
  - No complex CI pipeline.

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

Decision:
  - Minimal or no analytics initially.
  - If added, privacy-conscious and lightweight.

Possible approach:
  - Vercel Analytics or a simple, privacy-friendly solution.
  - No behavioural tracking.
  - No third-party ad or tracking pixels.

Rationale:
  - Fan site
  - Personal project
  - Respect user privacy

## Open Questions

**Resolved:**
  - ✅ Supabase integration added for future data needs
  - ✅ RSS parser integrated for content feeds
  - ✅ Component architecture established with TypeScript

**Still Open:**
  - Whether additional tooling such as Storybook is worth introducing
  - Whether the Spurs Women section should eventually be split into its own deployable unit
  - Whether analytics or content management will be added later
  - Performance monitoring and optimization strategy
  - Testing automation approach for key user flows
  - **Layout Architecture**: Consider introducing BlogTemplate pattern for structured content sections (e.g., London 2012 blog expansion) while maintaining MainSitePage for varied portfolio pages

## Explicit Non-Goals (for Now)
The following are intentionally out of scope for MVP:
  - Multi-language support
  - Enterprise-grade CI/CD pipelines
  - Comprehensive automated testing
  - Advanced analytics or tracking
  - Full CMS integration

These may be revisited only if the project’s scope or audience changes significantly.

---

## Code Review Findings (February 2026)

### Caching Feature Production Readiness Assessment

**Status**: ✅ PRODUCTION READY with configuration requirements

**Summary**: The caching implementation is well-architected and follows best practices, but requires security and monitoring improvements for full production deployment.

**Key Findings**:
- **Architecture**: Proper use of Next.js `unstable_cache` with tag-based invalidation
- **Coverage**: All data access points properly cached with appropriate TTLs
- **Error Handling**: Graceful fallback to fresh data on cache failures
- **Security**: API key protection for cache invalidation endpoints

**Production Requirements**:
1. **API Key Security**: Remove default dev key `'default-cache-key-for-dev'` for production
2. **Monitoring**: Add cache hit rate metrics and performance monitoring
3. **Code Quality**: Consolidate duplicate authentication logic across routes

**Tech Debt Items Added to Todo List**:
- Remove default dev API key from cache routes (High Priority)
- Add cache monitoring and metrics collection (High Priority)
- Consolidate duplicate API key authentication logic (Medium Priority)
- Add cache size monitoring and memory usage visibility (Medium Priority)
- Improve error context in cache failures (Medium Priority)
- Add automated tests for cache behavior (Low Priority)
- Use more granular TTL values where appropriate (Low Priority)

---

## Code Review Findings (January 2026)

### Critical Compliance Issues

#### 1. CSS Variable Usage Violations
**Issue**: The project context states "**ALWAYS use CSS variables (via Tailwind config and `:root`) for colors - never hardcode color values in CSS**", but there are numerous violations:

- **`globals.css`**: Contains 106 instances of hardcoded `rgba()` values
- **Examples**: `rgba(45, 90, 45, 0.3)`, `rgba(120, 190, 232, 0.3)`, `rgba(0, 0, 0, 0.1)`

**Required Action**: Replace all hardcoded `rgba()` values with CSS variables or Tailwind utilities per context guidelines (lines 140-148).

#### 2. Button Migration Incomplete
**Issue**: The project has a new Button component but migration is incomplete:

- **`Button.tsx`**: Uses CSS classes like `'button primary'` and `'button secondary'` instead of Tailwind utilities
- **`contact-me/page.tsx`**: Line 152 shows `<Button className="button primary">` - mixing old and new patterns
- **Migration guide exists** but many files still use old button patterns

**Status**: ~70% complete - 11 files migrated, 6 files still need migration (see BUTTON_MIGRATION.md for details)

**Required Action**: Complete button migration across all files listed in BUTTON_MIGRATION.md.

#### 3. dangerouslySetInnerHTML Usage
**Issue**: Two Spurs Women components use `dangerouslySetInnerHTML`:

- **`MatchHeader.tsx`**: Line 33 renders `competition.icon_svg`
- **`MatchCard.tsx`**: Line 56 renders `match.competitions.icon_svg`

**Required Action**: Find safer alternatives for SVG rendering to avoid security risks.

#### 4. Tailwind Config Issues
**Issue**: The `tailwind.config.ts` contains extensive hardcoded color arrays that contradict the CSS variable approach.

**Required Action**: Remove hardcoded color arrays in favor of CSS variables.

#### 5. Component Architecture Inconsistencies
**Issue**: Some components don't follow established patterns:

- **`MatchHeader.tsx`**: Contains TODO comment about H1 styling (line 64)
- Mixed styling approaches between CSS classes and Tailwind utilities

**Required Action**: Standardize component styling approaches.

### Positive Compliance ✅

- **TypeScript Usage**: All components use TypeScript properly with good type definitions
- **Server Components by Default**: Most components are server components unless interaction is needed
- **File Structure**: Follows the established `app/` and `components/` organization
- **Technology Stack**: Next.js 16.1.1, Tailwind CSS v4, TypeScript 5 correctly implemented
- **Supabase Integration**: Present as planned

### Current Todo List Integration

# Todo List

**Main Site:**
- ✅  Adjust width of cards for large screens on experience page
- ✅  Lightning series is still showing a flicker of light mode when loading
- [ ] Add London 2012 pages
- [ ] Fix Regicide Game (Note: Game appears to have structure but is not functional)
- [ ] Work on Salesforce Orgs page as sucks at the moment
- [ ] **Configure Tailwind CSS to properly use CSS variables** - Currently CSS variables like `--brand-primary-dark` exist but aren't accessible via Tailwind classes, leading to confusion and inconsistent styling

**Spurs Women Site:**
- ✅  Fix the colour scheme in general
- ✅ Add external video media type
- ✅ Cache database for api calls on Spurs women
- [ ] Ensure we have a backup primary and secondary colour in case they are not input - and teamname probably too
- [ ] Add players (starters, subs, unused bench)
- [ ] Add match stats where available
- [ ] Add goal scorers to match page

**Caching Tech Debt:**
- ✅ Remove default dev API key from cache routes for production security
- [ ] Add cache monitoring and metrics collection for hit rates and performance
- [ ] Consolidate duplicate API key authentication logic across cache routes
- [ ] Add cache size monitoring and memory usage visibility
- [ ] Improve error context in cache failures with better debugging info
- [ ] Add automated tests for cache behavior and invalidation
- [ ] Use more granular TTL values instead of generic STATIC_CONTENT where appropriate

### Priority Action Items

1. **Fix CSS Variable Violations** (Critical) - 106 hardcoded rgba() values in globals.css
2. **Complete Button Migration** (High) - ~70% complete, 6 files still need migration
3. **Address dangerouslySetInnerHTML** (High - Security) - SVG rendering in MatchHeader.tsx and MatchCard.tsx
4. **Clean Up Tailwind Config** (Medium) - Hardcoded color arrays contradict CSS variable approach
5. **Standardize Component Styling** (Medium) - Mixed approaches between CSS classes and Tailwind utilities
6. **Add Cache Monitoring** (Medium) - No visibility into cache performance or hit rates

---

This document should be used by both humans and AI as the source of truth for architectural intent. If code and documentation disagree, the documentation should be updated deliberately rather than ignored.
