# Reference Documentation

This is the index for all project documentation. Start with
[`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) - it's the source of truth for
architecture, technical decisions, and project boundaries, for both humans and
AI agents working in this codebase.

## Site-Wide

| Doc | Covers |
|-----|--------|
| [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) | Architecture, tech stack, decisions, rules for coding agents |
| [`ellieatwhl-design-system/README.md`](./ellieatwhl-design-system/README.md) | Design philosophy, visual language, and component library conventions |
| [`CSS_ARCHITECTURE.md`](./CSS_ARCHITECTURE.md) | Modular CSS file structure and conventions |
| [`TAILWIND_MIGRATION_PLAN.md`](./TAILWIND_MIGRATION_PLAN.md) | Tailwind/hand-written-CSS coexistence, cascade-layers fix, open next steps |
| [`BUTTON_MIGRATION.md`](./BUTTON_MIGRATION.md) | Shared `Button` component usage and migration status |
| [`UPDATE_BANNER_MANAGEMENT.md`](./UPDATE_BANNER_MANAGEMENT.md) | The reusable `UpdateBanner` notification component |
| [`RELATED_LISTS_CONFIGURATION.md`](./RELATED_LISTS_CONFIGURATION.md) | Configuring related-record tables in the admin UI |
| [`testing/README.md`](./testing/README.md) | Testing requirements, patterns, and current coverage |
| [`fullstory/README.md`](./fullstory/README.md) | FullStory analytics integration |
| [`photo-gallery/README.md`](./photo-gallery/README.md) | GitHub-hosted photo gallery system |

## Spurs Women Section

| Doc | Covers |
|-----|--------|
| [`spurs-women/README.md`](./spurs-women/README.md) | Section overview: pages, components, data layer, DB schema (mirrored to Confluence) |
| [`spurs-women/admin/ADMIN_SYSTEM_DOCUMENTATION.md`](./spurs-women/admin/ADMIN_SYSTEM_DOCUMENTATION.md) | Admin UI and API routes (mirrored to Confluence) |
| [`spurs-women/cache/README.md`](./spurs-women/cache/README.md) | Caching strategy, TTLs, invalidation, deployment (mirrored to Confluence) |
| [`spurs-women/match-stats.md`](./spurs-women/match-stats.md) | `MatchStats`/`TeamPill` components and team-color utility |
| [`spurs-women/SEASON_STATISTICS_CALCULATIONS.md`](./spurs-women/SEASON_STATISTICS_CALCULATIONS.md) | How `SeasonStats` figures are calculated |
| [`spurs-women/api/API_DOCUMENTATION.md`](./spurs-women/api/API_DOCUMENTATION.md) | Public API endpoints (see also `openapi-spec.yaml` in the same folder; both mirrored to Confluence) |

## Conventions

- Each subfolder's entry point is `README.md` where one exists.
- Docs describe *current, living* behavior. One-off historical bug write-ups
  and completed migration plans are archived to the
  [`EW` Confluence space](https://eleanormatthewman.atlassian.net/wiki/spaces/EW/overview)
  (`Archive > Core Site` / `Archive > Spurs Women`) and then deleted from here
  once superseded, rather than kept around indefinitely - git history remains
  the record of *why* a change happened, Confluence keeps the write-up itself
  browsable. A doc with open next steps (e.g. an in-progress migration plan)
  stays here as living documentation until it's actually done.
- A few docs marked "mirrored to Confluence" above are dual-homed: this repo
  copy is still the source of truth, but a duplicate also lives under
  `Reference: Core Site` / `Reference: Spurs Women` in the `EW` space for
  browsing without cloning the repo. When you edit one of these, update the
  matching Confluence page in the same piece of work (see "Confluence
  documentation" in the root `CLAUDE.md`) - don't let the mirror silently go
  stale.
- If code and docs disagree, update the docs deliberately rather than leaving
  the mismatch.
