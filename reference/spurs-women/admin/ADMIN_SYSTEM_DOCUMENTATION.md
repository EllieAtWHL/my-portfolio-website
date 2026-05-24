# Admin System Documentation

## Overview

The admin system provides a web-based interface for managing Spurs Women's football data in the Supabase database. It includes a React-based UI at `/admin` and a set of API routes for CRUD operations on various data entities.

## Architecture

### Components

1. **Admin UI** (`src/app/admin/page.tsx`)
   - Single-page application with tabbed interface
   - Client-side React component with form handling
   - Authentication via Supabase Auth
   - Pagination for data tables

2. **API Routes** (`src/app/api/admin/*/route.ts`)
   - Next.js API routes for server-side operations
   - Authentication and authorization checks
   - Supabase service role client for admin operations (bypasses RLS)

3. **Utilities**
   - `src/lib/admin-api.ts` - Supabase admin client and error handling
   - `src/lib/api-client.ts` - Generic API call functions

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
  - `stadium_id` (string, UUID)
  - `attended` (boolean)
  - `notes` (string)
  - `home_team_id` (number)
  - `away_team_id` (number)

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
  - `id` (number)
  - `first_name` (string)
  - `last_name` (string)
  - `date_of_birth` (string, nullable)
  - `nationality` (string, nullable)
  - `position` (string, nullable)
  - `height_cm` (number, nullable)
  - `weight_kg` (number, nullable)
  - `profile_image_url` (string, nullable)
  - `is_active` (boolean)

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
  - `position` (string, nullable)

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

### Matches API
**Endpoint**: `/api/admin/matches`
**Methods**: GET, POST

**POST** - Create a new match
- Requires authentication
- Requires admin authorization
- Auto-calculates home/away team IDs based on `is_home_match` flag
- Returns created match data

**GET** - Fetch all matches
- Requires authentication
- Requires admin authorization
- Returns matches ordered by date (descending)

### Media API
**Endpoint**: `/api/admin/media`
**Methods**: GET, POST

**POST** - Create a new media entry
- Requires authentication
- Requires admin authorization
- Returns created media data

**GET** - Fetch all media
- Requires authentication
- Requires admin authorization
- Returns media ordered by `created_at` (descending)

### Teams API
**Endpoint**: `/api/admin/teams`
**Methods**: GET, POST

**POST** - Create a new team
- Requires authentication
- Requires admin authorization
- Returns created team data

**GET** - Fetch all teams
- No authentication required (used for dropdowns)
- Returns teams ordered by name

### Players API
**Endpoint**: `/api/admin/players`
**Methods**: GET, POST

**POST** - Create a new player
- Requires authentication
- Requires admin authorization
- Returns created player data

**GET** - Fetch all players
- No authentication required (used for dropdowns)
- Returns players ordered by last name

### Player Stats API
**Endpoint**: `/api/admin/player-stats`
**Methods**: GET, POST

**POST** - Create or update player stats
- Requires authentication
- Requires admin authorization
- Uses `upsert` with conflict resolution on `player_id, match_id`
- Returns created/updated stats data

**GET** - Fetch all player stats
- No authentication required
- Returns stats ordered by `created_at` (descending)

### Player History API
**Endpoint**: `/api/admin/player-history`
**Methods**: GET, POST

**POST** - Create a new player history entry
- Requires authentication
- Requires admin authorization
- Returns created history data

**GET** - Fetch all player history
- No authentication required
- Returns history ordered by `created_at` (descending)

### Stadiums API
**Endpoint**: `/api/admin/stadia`
**Methods**: GET, POST

**POST** - Create a new stadium
- Requires authentication
- Requires admin authorization
- Returns created stadium data

**GET** - Fetch all stadiums
- No authentication required (used for dropdowns)
- Returns stadiums ordered by name

### Stadium Names API
**Endpoint**: `/api/admin/stadium-names`
**Methods**: POST

**POST** - Create a new stadium name entry
- Requires authentication
- Requires admin authorization
- Returns created stadium name data

## Admin UI Features

### Tabbed Interface
The admin page provides tabs for managing different entity types:
- **Add Match** - Form to create new match records
- **Add Media** - Form to create new media entries
- **Add Team** - View recent teams (form not implemented)
- **Add Player** - View recent players (form not implemented)
- **Add Player Stats** - View recent player stats (form not implemented)
- **Add Player History** - View recent player history (form not implemented)
- **Add Stadium** - View recent stadiums (form not implemented)
- **Add Stadium Name** - View recent stadium names (form not implemented)

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
Each tab displays a paginated table of recent records:
- 20 records per page
- Pagination controls
- Displays relevant fields for each entity type
- Shows related data (e.g., player names in player stats table)

### Pagination
- Automatic pagination for large datasets
- Page navigation controls
- Total count and page indicators
- Resets to page 1 when switching tabs

## Utility Functions

### `callAdminApi`
Generic function for making API calls to admin endpoints.

```typescript
async function callAdminApi(
  endpoint: string,
  method: 'POST' | 'GET' = 'POST',
  payload?: any
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

2. **ID Types**: Most entities use UUID strings for IDs, but teams and players use integer IDs.

3. **Player Stats Upsert**: Player stats use `upsert` with conflict resolution on `player_id, match_id` to allow updating existing stats.

4. **Foreign Keys**: The admin UI handles type conversions between string UUIDs and integer IDs when displaying related data (e.g., player names in stats tables).

## Future Enhancements

Potential improvements to the admin system:
- Implement forms for all entity types (currently only Match and Media have forms)
- Add edit and delete functionality
- Add bulk import/export capabilities
- Add data validation on the server side
- Add audit logging for admin operations
- Implement role-based access control for multiple admin users
- Add file upload for media instead of URL input
