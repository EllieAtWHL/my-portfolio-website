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
  - Use CSS variables (via Tailwind config and `:root`) for:
    - Colours
    - Spacing where appropriate
    - Font decisions
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

## Explicit Non-Goals (for Now)
The following are intentionally out of scope for MVP:
  - Multi-language support
  - Enterprise-grade CI/CD pipelines
  - Comprehensive automated testing
  - Advanced analytics or tracking
  - Full CMS integration

These may be revisited only if the project’s scope or audience changes significantly.

---

This document should be used by both humans and AI as the source of truth for architectural intent. If code and documentation disagree, the documentation should be updated deliberately rather than ignored.
