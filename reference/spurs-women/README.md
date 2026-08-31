# Spurs Women Site Overview

The Spurs Women section (`/spurs-women`) is an unofficial fan site covering
Tottenham Hotspur Women matches, statistics, news, videos, and podcasts. For
overall project architecture, tech stack, and design decisions shared with the
rest of the site, see `reference/PROJECT_CONTEXT.md` - this doc covers what's
specific to the Spurs Women section.

## Related Documentation

- **Admin system**: `admin/ADMIN_SYSTEM_DOCUMENTATION.md`
- **Caching**: `cache/README.md`
- **Match statistics component**: `match-stats.md`
- **Season statistics calculations**: `SEASON_STATISTICS_CALCULATIONS.md`
- **Public API reference**: `api/API_DOCUMENTATION.md` (see also `api/openapi-spec.yaml`)

The backlog/TODO list lives in Jira (`WEB` project, `spurs-women` label), not in this repo - see "Jira is the source of truth" in the root `CLAUDE.md`.

## Project Structure

```
src/
├── app/spurs-women/
│   ├── layout.tsx              # Root layout for the section
│   ├── page.tsx                 # Homepage with aggregated content
│   ├── matches/                 # All matches (filterable) + [matchId] detail pages
│   ├── seasons/                 # All seasons + [seasonId] detail pages
│   ├── teams/                   # All teams + [teamId] detail pages
│   ├── players/                 # All players + [playerId] detail pages
│   ├── stadiums/                # All stadiums + [stadiumSlug] detail pages
│   └── admin/                   # Admin UI (see admin/ADMIN_SYSTEM_DOCUMENTATION.md)
├── components/spurs-women/      # Section-specific components
├── lib/data/                    # Data access layer (see below)
└── utils/supabase.ts            # Database connection
```

## Pages and Routes

| Route | Purpose |
|-------|---------|
| `/spurs-women` | Homepage: next/previous 3 matches, latest news (6), podcasts (2), YouTube videos |
| `/spurs-women/matches` | All matches with filtering (competition, season, team, venue, date range) |
| `/spurs-women/matches/[matchId]` | Match detail: stats, lineups, media, head-to-head, prev/next navigation |
| `/spurs-women/seasons` | Grid of all seasons with match counts |
| `/spurs-women/seasons/[seasonId]` | Season detail: full match list, statistics dashboard, season review |
| `/spurs-women/teams` | Grid of all teams with match counts |
| `/spurs-women/teams/[teamId]` | Team detail: match history, head-to-head vs Spurs |
| `/spurs-women/players` | Grid of all players with stats summary |
| `/spurs-women/players/[playerId]` | Player profile: match history, career timeline |
| `/spurs-women/stadiums` | Grid of all stadiums with match counts |
| `/spurs-women/stadiums/[stadiumSlug]` | Stadium detail: historical names, match history, capacity/location |

## Components

Key components under `src/components/spurs-women/`:

- **Layout**: `SpursHeader`, `SpursFooter`
- **Matches**: `MatchCard`, `MatchStats` (see `match-stats.md`), `MatchFilterControls`, `SeasonStats` (see `SEASON_STATISTICS_CALCULATIONS.md`)
- **Media**: `NewsCard`, `VideoCard`, `PodcastCard`, `LightboxGallery`, `SeasonReviewCard`, `MediaGallery` (see `reference/photo-gallery/README.md`)
- **Players**: `PlayerTable` (with `PlayerRow`), `TeamLineup` (`PlayerCard` was dead code under `src/components/spurs-women/` and has since been deleted outright, under WEB-29; `MatchFilters.tsx` - distinct from the actively-used `MatchFilterControls.tsx` - is the current unimported dead-code component in this directory, see `reference/TAILWIND_MIGRATION_PLAN.md`)
- **Utility**: `TeamPill` (team-colored name pill), `InteractiveMap` (stadium location)

## Data Layer

All data fetching goes through `src/lib/data/`, organized by entity - pages and
components never fetch data directly. Caching is applied here (see
`cache/README.md`).

| Module | Key functions |
|--------|---------------|
| `matches.ts` | `getUpcomingMatches`, `getPreviousMatches`, `getAllMatches`, `getSeasonMatches`, `getMatchById`, `getAdjacentMatches` |
| `seasons.ts` | `getSeasons`, `getSeasonsWithMatchCounts`, `getSeasonById`, `getSeasonReview` |
| `news.ts` | `getSpursWomenNews`, `getSpursWomenVideos`, `getPodcasts`, `getHomePageContent` |
| `stadiums.ts` | `getStadiumBySlug`, `getAllStadiums`, `getStadiumsWithMatchCounts`, `getStadiumNames`, `getMatchesAtStadium`, `getCurrentStadiumName` |
| `players.ts` | `getPlayersByMatch`, `getTeamLineupsByMatch`, `getPlayerById`, `getPlayerMatchHistory` |
| `teams.ts` | `getAllTeams`, `getTeamsWithMatchCounts`, `getTeamById`, `getMatchesForTeam`, `getPlayersForTeam` |
| `media.ts` | `getMediaByMatch`, `getPhotosByMatch`, `getArticlesByMatch`, `getSocialMediaByMatch`, `getVideosByMatch` |

## Database Schema

Core tables (Supabase/PostgreSQL):

- **`matches`** - fixtures/results, scores, kickoff time, stadium, attendance, and match statistics (possession, shots, corners) as columns
- **`teams`** - `id` (int), `name`, `short_name`, `primary_color`, `secondary_color`, `is_tottenham`
- **`seasons`** - `id`, `name`, `start_date`, `end_date`, `season_review`
- **`competitions`** - `id`, `name`, `icon_svg`, `short_name`
- **`stadia`** (plural table name) - venue details, capacity, location, `home_team_id`
- **`stadium_names`** - historical name changes per stadium, with `valid_from`/`valid_to`
- **`players`** - profile fields, indexed on `last_name`
- **`player_history`** - squad membership per team (`joined_on`/`left_on`, loan flag), indexed on `player_id`/`team_id`
- **`player_stats`** - per-match player statistics (goals, assists, cards, minutes, ratings, etc.), unique on `(player_id, match_id)`, RLS enabled with public SELECT policy
- **`media`** - photos, articles, social posts, videos linked to a match; see `reference/photo-gallery/README.md` for the `type = 'photo album'` / GitHub folder-key convention

See `admin/ADMIN_SYSTEM_DOCUMENTATION.md` for the full field-level breakdown used by the admin CRUD forms.

## Features

- **Match statistics**: possession/shots/corners visualization - `match-stats.md`
- **Season statistics**: league vs. cup performance separation, attendance, points-per-game - `SEASON_STATISTICS_CALCULATIONS.md`
- **Advanced filtering**: competition, season, team, venue, date range (`MatchFilterControls.tsx`)
- **RSS integration**: news aggregation from multiple sources, YouTube channel videos, podcast feeds (N17 Women, Hometown Glory)

## Styling and Theming

- Tailwind CSS with a Spurs-specific design system: primary navy (`#132257`), white, gray accents
- Utility classes: `.spurs-text`, `.spurs-wrapper`, `.spurs-accent`
- **No dedicated light/dark mode design for this section, but the toggle isn't fully inert here**: the section is designed around a single fixed navy theme - `.spurs-wrapper` (in `spurs-theme.css`) sets its background and text color unconditionally, not gated behind a `.dark`/`.light` class. However, `ThemeProvider` (in `src/app/layout.tsx`) wraps the *entire* app, including `/spurs-women`, and a couple of Spurs Women components/pages do ship stray `dark:` Tailwind variants (e.g. `src/app/spurs-women/page.tsx`, `PlayerTable.tsx`) - per the cascade-layers rules in `CSS_ARCHITECTURE.md`, a Tailwind `dark:` utility on a specific element wins over `.spurs-wrapper`'s unconditional color regardless of specificity, so those elements *do* visibly respond to the site's theme toggle. This is inconsistent, not an intentional per-element design - don't add new `dark:` variants in this section, and treat any existing ones as leftover rather than a pattern to follow. (`NewsCard.tsx` previously had this same issue but has since been cleaned up - it now has no `dark:` classes, with a comment explaining it only renders inside `.spurs-accent-card`, which is always dark regardless of the toggle.)
- Team colors are data-driven (`primary_color`/`secondary_color` columns) - see `TeamPill` and `getTeamColor` in `match-stats.md`
- See `reference/CSS_ARCHITECTURE.md` for the site-wide CSS conventions this section follows

## Performance and Caching

Next.js `unstable_cache` with tag-based invalidation - see `cache/README.md`
for TTLs, cache keys, invalidation, and monitoring.

## External Integrations

- **YouTube**: video metadata via the oEmbed API, thumbnails, publish dates
- **RSS feeds**: news and podcast aggregation, with HTML sanitization and fallback content on feed failure
- **API routes**: `/api/spurs-women-news`, `/api/spurs-women-videos` - server-side fetching, caching, and error fallback
