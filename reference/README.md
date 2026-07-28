# Reference Documentation

This is the index for all project documentation. Start with
[`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) - it's the source of truth for
architecture, technical decisions, and project boundaries, for both humans and
AI agents working in this codebase.

## Site-Wide

| Doc | Covers |
|-----|--------|
| [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) | Architecture, tech stack, decisions, rules for coding agents |
| [`CSS_ARCHITECTURE.md`](./CSS_ARCHITECTURE.md) | Modular CSS file structure and conventions |
| [`BUTTON_MIGRATION.md`](./BUTTON_MIGRATION.md) | Shared `Button` component usage and migration status |
| [`DARK_MODE_FLASH_FIX.md`](./DARK_MODE_FLASH_FIX.md) | How flash-of-light-mode-on-load is prevented |
| [`UPDATE_BANNER_MANAGEMENT.md`](./UPDATE_BANNER_MANAGEMENT.md) | The reusable `UpdateBanner` notification component |
| [`RELATED_LISTS_CONFIGURATION.md`](./RELATED_LISTS_CONFIGURATION.md) | Configuring related-record tables in the admin UI |
| [`testing/README.md`](./testing/README.md) | Testing requirements, patterns, and current coverage |
| [`fullstory/README.md`](./fullstory/README.md) | FullStory analytics integration |
| [`photo-gallery/README.md`](./photo-gallery/README.md) | GitHub-hosted photo gallery system |

## Spurs Women Section

| Doc | Covers |
|-----|--------|
| [`spurs-women/README.md`](./spurs-women/README.md) | Section overview: pages, components, data layer, DB schema |
| [`spurs-women/admin/ADMIN_SYSTEM_DOCUMENTATION.md`](./spurs-women/admin/ADMIN_SYSTEM_DOCUMENTATION.md) | Admin UI and API routes |
| [`spurs-women/cache/README.md`](./spurs-women/cache/README.md) | Caching strategy, TTLs, invalidation, deployment |
| [`spurs-women/match-stats.md`](./spurs-women/match-stats.md) | `MatchStats`/`TeamPill` components and team-color utility |
| [`spurs-women/SEASON_STATISTICS_CALCULATIONS.md`](./spurs-women/SEASON_STATISTICS_CALCULATIONS.md) | How `SeasonStats` figures are calculated |
| [`spurs-women/DEVELOPMENT_TODO.md`](./spurs-women/DEVELOPMENT_TODO.md) | Open backlog, prioritized |

## Conventions

- Each subfolder's entry point is `README.md` where one exists.
- Docs describe *current, living* behavior. One-off historical bug write-ups
  and completed migration plans are deleted once superseded rather than kept
  around - git history is the record of what changed and why.
- If code and docs disagree, update the docs deliberately rather than leaving
  the mismatch.
