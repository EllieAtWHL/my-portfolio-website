# Admin System Documentation

## Overview

The admin system provides a web-based interface for managing Spurs Women's football data in the Supabase database. It includes a React-based UI at `/spurs-women/admin` and a set of API routes for CRUD operations on various data entities.

## Architecture

### Components

1. **Admin UI** (`src/app/spurs-women/admin/page.tsx`)
   - Tabbed single-page interface; `page.tsx` itself is a composition root (~870 lines) that wires hooks to components, not where the logic lives
   - Per-entity state and CRUD logic live in hooks under `src/hooks/admin/` (`useMatchesAdmin`, `useTeamsAdmin`, `usePlayersAdmin`, `useStadiumsAdmin`, plus `usePlayerStatsModal` for the player-stats modal shared between the matches and players tabs)
   - Presentational pieces live under `src/components/admin/`: `TabNav`, `Pagination`, entity tables in `tables/` (built on a shared `DataTable`), and related-record modals in `modals/` (built on a shared `FormModal`) — see "Frontend Component Architecture" below
   - Authentication via Supabase Auth
   - Pagination for data tables, via the generic `useSearchPagination` hook

2. **API Routes** (`src/app/api/admin/*/route.ts`)
   - Next.js API routes for server-side operations
   - Authentication and authorization checks
   - Supabase service role client for admin operations (bypasses RLS)

3. **Utilities**
   - `src/lib/admin-api.ts` - Supabase admin client and error handling
   - `src/lib/api-client.ts` - Generic API call functions

### Frontend Component Architecture

`page.tsx` was originally a single ~3,100-line file (types, all state, all CRUD handlers, and all JSX in one component). It was decomposed into:

- **Types** — `src/types/spurs-women-admin.ts` (shared entity interfaces)
- **Generic hooks** — `src/hooks/useSearchPagination.ts` (search + pagination over any list)
- **Per-entity hooks** — `src/hooks/admin/{useMatchesAdmin,useTeamsAdmin,usePlayersAdmin,useStadiumsAdmin}.ts`, each owning that entity's list state, edit-mode state, and CRUD handlers. `usePlayerStatsModal.ts` is a separate hook because the player-stats modal is opened from *both* the matches and players tabs — it's wired in `page.tsx` with setters from both `useMatchesAdmin` and `usePlayersAdmin`, which is the trickiest piece of cross-hook wiring on the page (see the "adds player stats to a player" test in `page.test.tsx`, which specifically exercises this wiring).
- **Entity tables** — `src/components/admin/tables/{MatchesTable,TeamsTable,PlayersTable,StadiumsTable}.tsx`, each a thin column-definition wrapper around a shared `DataTable.tsx`.
- **Related-record modals** — `src/components/admin/modals/{MediaModal,PlayerStatsModal,PlayerHistoryModal,StadiumNameModal}.tsx`, each a thin fields-only wrapper around a shared `FormModal.tsx` (handles the overlay/card/title/error-banner/footer-buttons chrome).
- **Nav/pagination** — `TabNav.tsx`, `Pagination.tsx`.

**Why `RelatedList.tsx` was *not* merged onto `DataTable`**: `RelatedList` renders the Media/Player Stats/Player History/Stadium Name lists shown inside a match/player/stadium's "Related Records" tab, and looks superficially like the same table-rendering job as the four entity tables. It was deliberately left as its own component rather than rebuilt on `DataTable`, because:
1. `DataTable`'s `render` is mandatory by design, so it never needs to touch a record field via an unsafe cast. `RelatedList` relies on an *optional* `render` with a `record[key] ?? '-'` fallback (used by roughly a dozen column definitions in `page.tsx`) — supporting that would mean reintroducing that unsafe cast into `DataTable`, i.e. moving complexity into the component that's currently simplest.
2. `RelatedList` also renders its own title/count/"New" button header and hides the table entirely (not just the rows) when there are no records — different chrome from the bare entity tables.
3. `RelatedList` has no dedicated unit test file (only indirect coverage via `page.test.tsx`), and is wired into the riskiest part of the page (the shared player-stats modal, `usePlayerStatsModal`). A regression there is less likely to be caught immediately than one in the entity tables, which each have their own test file.

Net: the two components serve different-enough call shapes that forcing them through one interface would grow `DataTable`'s prop surface to satisfy a union of needs no single caller actually has — not a simplification. If `RelatedList`'s duplication becomes a real problem later, revisit this, but as of this writing it's ~35 lines of overlap against a component with a materially different contract.

## Authentication & Authorization

### Authentication
- Uses Supabase Auth for user authentication
- User must be logged in to access admin features
- Session managed via cookies

### Authorization
- Admin access restricted to a single email address
- Configured via `ADMIN_EMAIL` environment variable
- API routes verify user email matches admin email before allowing operations

```typescript
const adminEmail = process.env.ADMIN_EMAIL;
if (!adminEmail || user.email !== adminEmail) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## Data Entities

The admin system manages the following entities:

### Match
- **Table**: `matches`
- **Fields**:
  - `id` (string, UUID)
  - `season_id` (string, UUID)
  - `competition_id` (string, UUID)
  - `date` (string, date)
  - `kickoff_time` (string, time)
  - `is_home_match` (boolean)
  - `spurs_score` (number, nullable)
  - `opponent_score` (number, nullable)
  - `spurs_score_aet` (number, nullable)
  - `opponent_score_aet` (number, nullable)
  - `spurs_score_pens` (number, nullable)
  - `opponent_score_pens` (number, nullable)
  - `stadium_id` (string, UUID)
  - `stadium_display_name` (string, nullable)
  - `attended` (boolean)
  - `attendance` (number, nullable)
  - `notes` (string, nullable)
  - `home_team_id` (number)
  - `away_team_id` (number)
  - `home_possession` / `away_possession` (number, nullable)
  - `home_total_shots` / `away_total_shots` (number, nullable)
  - `home_shots_on_target` / `away_shots_on_target` (number, nullable)
  - `home_corners` / `away_corners` (number, nullable)

  Blank score/stat fields must be saved as `null`, not `0` (a blank field and a genuine 0 mean different things — e.g. `matches.ts` uses `spurs_score is null` to detect upcoming/unscored fixtures). This is enforced by `buildMatchPayload` in `src/lib/admin-match-payload.ts`, which the admin match form's submit handler uses to build its API payload — reuse it rather than constructing the payload inline.

### Media
- **Table**: `media`
- **Fields**:
  - `id` (string, UUID)
  - `match_id` (string, UUID)
  - `type` (enum: 'photo' | 'photo album' | 'article' | 'social media' | 'video-external')
  - `title` (string, nullable)
  - `url` (string)
  - `caption` (string, nullable)
  - `sort_order` (number)

### Team
- **Table**: `teams`
- **Fields**:
  - `id` (number)
  - `name` (string)
  - `short_name` (string)
  - `is_tottenham` (boolean)
  - `primary_color` (string, nullable)
  - `secondary_color` (string, nullable)

### Player
- **Table**: `players`
- **Fields**:
  - `id` (string, UUID)
  - `first_name` (string)
  - `last_name` (string)
  - `date_of_birth` (string, nullable)
  - `nationality` (string, nullable)
  - `position` (string, nullable)
  - `height_cm` (number, nullable)
  - `weight_kg` (number, nullable)
  - `profile_image_url` (string, nullable)
  - `squad_number` (number, nullable)
  - `is_active` (boolean)
  - `created_at` (string, timestamp)
  - `updated_at` (string, timestamp)

### Player Stats
- **Table**: `player_stats`
- **Fields**:
  - `id` (string, UUID)
  - `player_id` (string, UUID)
  - `match_id` (string, UUID)
  - `team_id` (number)
  - `started` (boolean)
  - `captain` (boolean)
  - `was_substitute` (boolean)
  - `was_unused_substitute` (boolean)
  - `minute_on` (number, nullable)
  - `minute_off` (number, nullable)
  - `minutes_played` (number)
  - `goals` (number)
  - `assists` (number)
  - `yellow_cards` (number)
  - `red_cards` (number)
  - `clean_sheet` (boolean, nullable)
  - `saves` (number, nullable)
  - `shots` (number)
  - `shots_on_target` (number)
  - `passes_completed` (number, nullable)
  - `passes_attempted` (number, nullable)
  - `tackles` (number, nullable)
  - `interceptions` (number, nullable)
  - `clearances` (number, nullable)
  - `fouls_committed` (number, nullable)
  - `fouls_won` (number, nullable)
  - `offsides` (number, nullable)
  - `player_rating` (number, nullable)
  - `player_of_the_match` (boolean)

### Player History
- **Table**: `player_history`
- **Fields**:
  - `id` (string, UUID)
  - `player_id` (string, UUID)
  - `team_id` (number)
  - `joined_on` (string, nullable)
  - `left_on` (string, nullable)
  - `squad_number` (number, nullable)

### Stadium
- **Table**: `stadia` (note: plural table name)
- **Fields**:
  - `id` (string, UUID)
  - `name` (string)
  - `slug` (string)
  - `city` (string, nullable)
  - `country` (string, nullable)
  - `capacity` (number, nullable)
  - `opened_date` (string, nullable)
  - `address_line_1` (string, nullable)
  - `postcode` (string, nullable)
  - `latitude` (number, nullable)
  - `longitude` (number, nullable)
  - `home_team_id` (number, nullable)

### Stadium Name
- **Table**: `stadium_names`
- **Fields**:
  - `id` (string, UUID)
  - `stadium_id` (string, UUID)
  - `name` (string)
  - `valid_from` (string, nullable)
  - `valid_to` (string, nullable)

## API Routes

All entity routes below also implement `PUT` (update by `id`) and `DELETE` (delete by `id`), both requiring authentication and admin authorization, except Stadium Names (no `PUT`) and Seasons/Competitions (read-only, see bottom).

### Matches API
**Endpoint**: `/api/admin/matches`
**Methods**: GET, POST, PUT, DELETE

**POST** - Create a new match
- Requires authentication
- Requires admin authorization
- Auto-calculates home/away team IDs based on `is_home_match` flag
- Returns created match data

**GET** - Fetch all matches
- Requires authentication
- Requires admin authorization
- Returns matches ordered by date (descending)

**PUT** / **DELETE** - Update / delete a match by `id`
- Requires authentication and admin authorization

### Media API
**Endpoint**: `/api/admin/media`
**Methods**: GET, POST, PUT, DELETE

**POST** - Create a new media entry
- Requires authentication
- Requires admin authorization
- Returns created media data

**GET** - Fetch all media
- Requires authentication
- Requires admin authorization
- Returns media ordered by `created_at` (descending)

**PUT** / **DELETE** - Update / delete a media entry by `id`
- Requires authentication and admin authorization

### Teams API
**Endpoint**: `/api/admin/teams`
**Methods**: GET, POST, PUT, DELETE

**POST** - Create a new team
- Requires authentication
- Requires admin authorization
- Returns created team data

**GET** - Fetch all teams
- No authentication required (used for dropdowns)
- Returns teams ordered by name

**PUT** / **DELETE** - Update / delete a team by `id`
- Requires authentication and admin authorization

### Players API
**Endpoint**: `/api/admin/players`
**Methods**: GET, POST, PUT, DELETE

**POST** - Create a new player
- Requires authentication
- Requires admin authorization
- Returns created player data

**GET** - Fetch all players
- No authentication required (used for dropdowns)
- Returns players ordered by last name

**PUT** / **DELETE** - Update / delete a player by `id`
- Requires authentication and admin authorization

### Player Stats API
**Endpoint**: `/api/admin/player-stats`
**Methods**: GET, POST, PUT, DELETE

**POST** - Create or update player stats
- Requires authentication
- Requires admin authorization
- Uses `upsert` with conflict resolution on `player_id, match_id`
- Returns created/updated stats data

**GET** - Fetch all player stats
- No authentication required
- Returns stats ordered by `created_at` (descending)

**PUT** / **DELETE** - Update / delete a player stats record by `id`
- Requires authentication and admin authorization

### Player History API
**Endpoint**: `/api/admin/player-history`
**Methods**: GET, POST, PUT, DELETE

**POST** - Create a new player history entry
- Requires authentication
- Requires admin authorization
- Returns created history data

**GET** - Fetch all player history
- No authentication required
- Returns history ordered by `created_at` (descending)

**PUT** / **DELETE** - Update / delete a player history entry by `id`
- Requires authentication and admin authorization

### Stadiums API
**Endpoint**: `/api/admin/stadia`
**Methods**: GET, POST, PUT, DELETE

**POST** - Create a new stadium
- Requires authentication
- Requires admin authorization
- Returns created stadium data

**GET** - Fetch all stadiums
- No authentication required (used for dropdowns)
- Returns stadiums ordered by name

**PUT** / **DELETE** - Update / delete a stadium by `id`
- Requires authentication and admin authorization

### Stadium Names API
**Endpoint**: `/api/admin/stadium-names`
**Methods**: GET, POST, DELETE (no PUT)

**POST** - Create a new stadium name entry
- Requires authentication
- Requires admin authorization
- Returns created stadium name data

**GET** - Fetch all stadium names
- Requires authentication and admin authorization

**DELETE** - Delete a stadium name entry by `id`
- Requires authentication and admin authorization

### Seasons API
**Endpoint**: `/api/admin/seasons`
**Methods**: GET only

**GET** - Fetch all seasons (used for dropdowns)

### Competitions API
**Endpoint**: `/api/admin/competitions`
**Methods**: GET only

**GET** - Fetch all competitions (used for dropdowns)

## Admin UI Features

### Tabbed Interface
The admin page has four top-level tabs - Matches, Teams, Players, Stadiums - each with its own paginated table and full add/edit/delete form. The create form is hidden by default; a "+ New" button reveals it (and toggles to "Cancel" to hide it again), while clicking an existing record in the table opens the same form already populated for editing. Media, Player Stats, Player History, and Stadium Name aren't separate tabs; they're related-record lists (unpaginated) shown inside a Match/Player/Stadium's edit view, each with its own add/edit/delete modal. All eight entity types now support add/edit/delete:
- **Match** - Add/edit/delete match records
- **Media** - Add/edit/delete media entries (grouped by media type, as related records under a match)
- **Team** - Add/edit/delete teams
- **Player** - Add/edit/delete players
- **Player Stats** - Add/edit/delete player stats (related list under a match)
- **Player History** - Add/edit/delete player history (related list under a player)
- **Stadium** - Add/edit/delete stadiums
- **Stadium Name** - Add/edit/delete stadium name history (related list under a stadium)

### Match Form
The match form includes:
- Season dropdown (populated from seasons table)
- Competition dropdown (populated from competitions table)
- Date picker
- Kickoff time picker
- Home/Away match toggle
- Opponent team dropdown (excludes Tottenham)
- Stadium dropdown
- Score inputs (Spurs and opponent)
- Attended checkbox
- Notes textarea

### Media Form
The media form includes:
- Match ID dropdown
- Media type selector (photo, photo album, article, social media, video-external)
- Title input
- URL input
- Caption textarea
- Sort order input

### Data Tables
Each of the four top-level tabs (Match, Team, Player, Stadium) displays a paginated table of records, filtered/paginated client-side over the full dataset already loaded for that tab:
- 20 records per page
- Displays relevant fields for each entity type

Related-record lists (Media, Player Stats, Player History, Stadium Name) render in full, unpaginated, inside their parent record's edit view - they show related data such as player names in the player stats list, and the match opponent (derived from the match's home/away teams relative to the stat's `team_id`) in a player's Player Stats list.

### Pagination
- Each top-level tab tracks its own current page/total pages, independently of the others
- Page navigation controls (Previous/Next) per tab
- Resets to page 1 when switching tabs or when filtering/search changes the result count

## Utility Functions

### `callAdminApi`
Generic function for making API calls to admin endpoints.

```typescript
async function callAdminApi(
  endpoint: string,
  method: 'POST' | 'GET' | 'PUT' | 'DELETE' = 'POST',
  payload?: unknown
): Promise<ApiResponse>
```

### `createEntityAndReload`
Helper function to create an entity and reload data.

```typescript
async function createEntityAndReload<T>(
  endpoint: string,
  payload: any,
  reloadEndpoint: string,
  setData: (data: T[]) => void
): Promise<void>
```

### `handleApiError`
Standardized error handling for API responses.

```typescript
function handleApiError(error: any, defaultMessage: string = 'Operation failed')
```

### `handleApiSuccess`
Standardized success response formatting.

```typescript
function handleApiSuccess(data: any, message: string = 'Operation successful')
```

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `ADMIN_EMAIL` - Email address authorized for admin access

## Security Considerations

1. **Service Role Key**: The admin system uses the Supabase service role key, which bypasses Row Level Security (RLS). This key must be kept secure and never exposed to the client.

2. **Authorization**: API routes check that the authenticated user's email matches the `ADMIN_EMAIL` environment variable before allowing operations.

3. **Authentication**: All admin operations require user authentication via Supabase Auth.

4. **Server-Side Operations**: Sensitive operations are performed server-side via API routes, not directly from the client.

## Database Schema Notes

1. **Stadium Table Name**: The stadium table is named `stadia` (plural) in the database, but the code also tries `stadiums` and `stadium` as fallbacks.

2. **ID Types**: Most entities use UUID strings for IDs, but teams use integer IDs (players use UUID strings, like most other entities).

3. **Player Stats Upsert**: Player stats use `upsert` with conflict resolution on `player_id, match_id` to allow updating existing stats.

4. **Foreign Keys**: The admin UI handles type conversions between string UUIDs and integer IDs when displaying related data (e.g., player names in stats tables).

## Future Enhancements

Potential improvements to the admin system:
- Add bulk import/export capabilities
- Add data validation on the server side
- Add audit logging for admin operations
- Implement role-based access control for multiple admin users
- Add file upload for media instead of URL input
