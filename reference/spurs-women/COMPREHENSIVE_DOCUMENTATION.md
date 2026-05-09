# Tottenham Hotspur Women Website - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Pages and Routes](#pages-and-routes)
4. [Components](#components)
5. [Data Layer](#data-layer)
6. [Features](#features)
7. [Database Schema](#database-schema)
8. [Styling and Theming](#styling-and-theming)
9. [Performance and Caching](#performance-and-caching)
10. [External Integrations](#external-integrations)
11. [Development Workflow](#development-workflow)
12. [TODO List](#todo-list)

## Overview

The Tottenham Hotspur Women website is a comprehensive web application built with Next.js that provides fans with detailed information about Spurs Women matches, statistics, news, videos, and podcasts. The site features a modern, responsive design with team-specific branding and extensive data visualization capabilities.

### Key Features
- **Match Management**: Complete match database with fixtures, results, and detailed statistics
- **Season Tracking**: Historical data organized by seasons with comprehensive statistics
- **Media Integration**: News articles, YouTube videos, and podcast episodes from external sources
- **Interactive Filtering**: Advanced filtering system for matches and data exploration
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Real-time Data**: Cached data fetching with intelligent invalidation

## Architecture

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Spurs-themed design system
- **Database**: Supabase (PostgreSQL)
- **Caching**: Custom caching layer with Redis-like functionality
- **Deployment**: Vercel (inferred from Next.js setup)

### Project Structure
```
src/
├── app/
│   └── spurs-women/
│       ├── layout.tsx              # Root layout for Spurs Women section
│       ├── page.tsx                # Homepage with aggregated content
│       ├── matches/
│       │   ├── page.tsx            # All matches with filtering
│       │   └── [matchId]/          # Individual match pages
│       ├── seasons/
│       │   ├── page.tsx            # All seasons overview
│       │   └── [seasonId]/         # Individual season pages
│       └── stadiums/
│           └── [stadiumSlug]/      # Individual stadium pages
├── components/
│   └── spurs-women/               # All Spurs Women specific components
├── lib/
│   └── data/                      # Data access layer with caching
└── utils/
    └── supabase.ts                # Database connection
```

## Pages and Routes

### Homepage (`/spurs-women`)
**File**: `src/app/spurs-women/page.tsx`

**Features**:
- Displays next 3 upcoming matches
- Shows previous 3 completed matches
- Latest news articles (limited to 6)
- Recent podcast episodes (limited to 2)
- Latest YouTube videos from Spurs Women channel
- Responsive grid layout with team branding

**Data Sources**:
- Matches: Supabase database with timezone-aware filtering
- News: RSS feed aggregation from multiple sources
- Videos: YouTube API integration
- Podcasts: RSS feeds from N17 Women and Hometown Glory

### Matches Page (`/spurs-women/matches`)
**File**: `src/app/spurs-women/matches/page.tsx`

**Features**:
- Comprehensive match filtering system
- Competition, season, team, and venue filters
- Date range filtering
- Responsive match card grid
- Real-time filter updates

**Filtering Options**:
- Competition type (WSL, FA Cup, League Cup, etc.)
- Season selection
- Team (home/away/opponent)
- Venue (home/away/neutral)
- Date ranges
- Attendance tracking

### Individual Match Pages (`/spurs-women/matches/[matchId]`)
**Files**: `src/app/spurs-women/matches/[matchId]/page.tsx`

**Features**:
- Detailed match information
- Head-to-head statistics
- Match statistics visualization (possession, shots, corners)
- Navigation to previous/next matches
- Team color integration
- Media galleries (when available)

### Seasons Page (`/spurs-women/seasons`)
**File**: `src/app/spurs-women/seasons/page.tsx`

**Features**:
- Grid layout of all seasons
- Match count for each season
- Navigation to detailed season pages
- Hover effects and team branding

### Individual Season Pages (`/spurs-women/seasons/[seasonId]`)
**Files**: `src/app/spurs-women/seasons/[seasonId]/page.tsx`

**Features**:
- Complete season match list
- Comprehensive statistics dashboard
- League vs cup performance separation
- Attendance tracking
- Season reviews (when available)
- Expandable statistics sections

## Components

### Layout Components

#### SpursHeader
**File**: `src/components/spurs-women/SpursHeader.tsx`
- Navigation header with team branding
- Responsive menu system
- Links to main sections

#### SpursFooter
**File**: `src/components/spurs-women/SpursFooter.tsx`
- Footer with team information
- Social media links
- Copyright information

### Match Components

#### MatchCard
**File**: `src/components/spurs-women/MatchCard.tsx`
- Responsive match display card
- Team colors and branding
- Score display for completed matches
- Kickoff time for upcoming matches
- Competition indicators

#### MatchStats
**File**: `src/components/spurs-women/MatchStats.tsx`
- Visual statistics display
- Possession, shots, corners visualization
- Team-colored progress bars
- Responsive grid layout
- Conditional rendering based on data availability

#### MatchFilterControls
**File**: `src/components/spurs-women/MatchFilterControls.tsx`
- Comprehensive filtering interface
- Multi-select dropdowns
- Date range pickers
- Real-time filter application
- Clear filters functionality

#### SeasonStats
**File**: `src/components/spurs-women/SeasonStats.tsx`
- Expandable statistics dashboard
- League vs cup performance separation
- Attendance tracking
- Goal statistics
- Win/loss records
- Points calculations

### Media Components

#### NewsCard
**File**: `src/components/spurs-women/NewsCard.tsx`
- News article display
- Image thumbnails
- Publication dates
- Source attribution
- Responsive layout

#### VideoCard
**File**: `src/components/spurs-women/VideoCard.tsx`
- YouTube video integration
- Thumbnail display
- Video duration
- Publication date
- Click-to-play functionality

#### PodcastCard
**File**: `src/components/spurs-women/PodcastCard.tsx`
- Podcast episode display
- Episode information
- Duration and publication date
- External link handling

### Utility Components

#### TeamPill
**File**: `src/components/spurs-women/TeamPill.tsx`
- Team name display with colors
- Primary/secondary color integration
- CSS override handling
- Responsive sizing

#### InteractiveMap
**File**: `src/components/spurs-women/InteractiveMap.tsx`
- Stadium location mapping
- Geographic visualization
- Integration with stadium data

## Data Layer

### Database Integration
**Connection**: `src/utils/supabase.ts`
- Type-safe database operations
- Connection pooling
- Error handling
- Environment configuration

### Caching System
**Location**: `src/lib/data/cache-utils.ts`

**Features**:
- Custom caching implementation
- TTL-based expiration
- Tag-based invalidation
- Memory-efficient storage
- Server-side caching

**Cache Categories**:
- Matches: 1-hour TTL for current season
- Static content: 24-hour TTL
- RSS feeds: 30-minute TTL
- YouTube videos: 2-hour TTL

### Data Access Functions

#### Matches (`src/lib/data/matches.ts`)
- `getUpcomingMatches()` - Future matches with timezone handling
- `getPreviousMatches()` - Completed match history
- `getAllMatches()` - Complete match database
- `getSeasonMatches()` - Season-specific matches
- `getMatchById()` - Individual match details
- `getAdjacentMatches()` - Navigation helpers

#### Seasons (`src/lib/data/seasons.ts`)
- `getSeasons()` - All seasons list
- `getSeasonsWithMatchCounts()` - Seasons with statistics
- `getSeasonById()` - Individual season details
- `getSeasonReview()` - Season review content

#### News (`src/lib/data/news.ts`)
- `getSpursWomenNews()` - RSS news aggregation
- `getSpursWomenVideos()` - YouTube integration
- `getPodcasts()` - Podcast RSS feeds
- `getHomePageContent()` - Aggregated homepage data

#### Stadiums (`src/lib/data/stadiums.ts`)
- `getStadiumBySlug()` - Individual stadium details
- `getAllStadiums()` - Complete stadium list
- `getStadiumNames()` - Historical stadium names
- `getMatchesAtStadium()` - Stadium-specific matches

## Features

### Match Statistics System
**Documentation**: `reference/spurs-women/match-stats.md`

**Components**:
- Visual representation of match data
- Team-colored progress bars
- Possession, shots, corners tracking
- Responsive grid layout
- Conditional rendering based on data availability

### Season Statistics Calculations
**Documentation**: `reference/spurs-women/SEASON_STATISTICS_CALCULATIONS.md`

**Features**:
- League vs cup performance separation
- Attendance tracking across competitions
- Goal statistics and differentials
- Win/loss records with percentages
- Points per game calculations
- Clean sheets tracking

### Advanced Filtering
**Location**: `src/components/spurs-women/MatchFilterControls.tsx`

**Filter Types**:
- Competition filtering (WSL, FA Cup, etc.)
- Season selection
- Team filtering (home/away/opponent)
- Venue selection (home/away/neutral)
- Date range filtering
- Attendance status

### RSS Integration
**Sources**:
- Multiple news websites for Spurs Women coverage
- YouTube channel for official videos
- Podcast feeds (N17 Women, Hometown Glory)

**Features**:
- Automatic content aggregation
- Error handling and fallbacks
- Content sanitization
- Image thumbnail extraction

## Database Schema

### Core Tables

#### Matches
```sql
matches (
  id INTEGER PRIMARY KEY,
  date DATE NOT NULL,
  kickoff_time TIME,
  home_team_id INTEGER REFERENCES teams(id),
  away_team_id INTEGER REFERENCES teams(id),
  spurs_score INTEGER,
  opponent_score INTEGER,
  competition_id INTEGER REFERENCES competitions(id),
  season_id INTEGER REFERENCES seasons(id),
  venue VARCHAR(255),
  stadium_display_name VARCHAR(255),
  stadium_slug VARCHAR(255),
  attendance INTEGER,
  attended BOOLEAN DEFAULT FALSE,
  notes TEXT,
  -- Match statistics
  home_possession INTEGER,
  away_possession INTEGER,
  home_total_shots INTEGER,
  away_total_shots INTEGER,
  home_shots_on_target INTEGER,
  away_shots_on_target INTEGER,
  home_corners INTEGER,
  away_corners INTEGER
)
```

#### Teams
```sql
teams (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  primary_color VARCHAR(50),
  secondary_color VARCHAR(50),
  is_tottenham BOOLEAN DEFAULT FALSE
)
```

#### Seasons
```sql
seasons (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  season_review TEXT
)
```

#### Competitions
```sql
competitions (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon_svg TEXT,
  short_name VARCHAR(50)
)
```

#### Stadiums
```sql
stadia (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  city VARCHAR(100),
  country VARCHAR(100),
  capacity INTEGER,
  opened_date DATE,
  address_line_1 TEXT,
  postcode VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  home_team_id INTEGER REFERENCES teams(id)
)
```

### Views and Functions

#### matches_with_stadium View
Combines match data with stadium information for efficient querying.

#### Cache Invalidation Functions
Automated cache clearing when data changes.

## Styling and Theming

### Design System
**Base**: Tailwind CSS with custom configuration

### Spurs Theme
- **Primary Colors**: Navy (#132257), White (#FFFFFF)
- **Accent Colors**: Gray tones for secondary elements
- **Typography**: Custom font loading with fallbacks
- **Responsive**: Mobile-first approach with breakpoints

### Custom Classes
```css
.spurs-text          /* Primary text color with gradient support */
.spurs-wrapper       /* Main content wrapper with proper spacing */
.spurs-accent        /* Accent backgrounds and borders */
```

### Component Styling
- Consistent spacing using Tailwind's spacing scale
- Responsive grids with appropriate breakpoints
- Hover states and transitions
- Accessibility considerations (focus states, ARIA labels)

## Performance and Caching

### Caching Strategy
**Implementation**: Custom in-memory caching with TTL

**Cache Hierarchy**:
1. **Static Content** (24 hours): Teams, seasons, competitions
2. **Current Season Data** (1 hour): Matches, statistics
3. **RSS Feeds** (30 minutes): News, podcasts
4. **YouTube Videos** (2 hours): Video metadata

### Performance Optimizations
- Image optimization with Next.js Image component
- Code splitting with dynamic imports
- Minimal bundle size through tree shaking
- Efficient database queries with proper indexing
- Server-side rendering for static content

### Monitoring
- Error tracking and logging
- Performance metrics collection
- Cache hit rate monitoring
- Database query optimization

## External Integrations

### YouTube API
**Purpose**: Fetch official Spurs Women videos
**Features**:
- Video metadata extraction
- Thumbnail generation
- Playlist integration
- Error handling for API limits

### RSS Feed Processing
**Sources**: Multiple news websites and podcasts
**Features**:
- Content aggregation from multiple sources
- HTML sanitization
- Image extraction and optimization
- Fallback content for failed feeds

### Podcast Integration
**Shows**:
- N17 Women (dedicated Spurs Women podcast)
- Hometown Glory (Spurs culture with women's team coverage)
**Features**:
- Episode metadata extraction
- Duration formatting
- Link generation to episode pages

## Development Workflow

### Environment Setup
1. **Database**: Supabase configuration
2. **Environment Variables**: API keys and database URLs
3. **Dependencies**: npm/yarn package management
4. **Development Server**: Next.js dev server

### Code Organization
- **Components**: Feature-based organization
- **Data Layer**: Separated by entity (matches, seasons, etc.)
- **Types**: TypeScript interfaces for all data structures
- **Utilities**: Reusable helper functions

### Testing Strategy
- **Unit Tests**: Component testing with Jest
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Critical user journey testing
- **Type Checking**: Strict TypeScript configuration

### Deployment
- **Platform**: Vercel (inferred)
- **Environment**: Production/staging separation
- **Build Process**: Optimized production builds
- **Monitoring**: Error tracking and performance monitoring

## TODO List

### High Priority
- [ ] **Match Statistics Enhancement**: Add more detailed statistics (fouls, cards, offsides)
- [ ] **Live Score Integration**: Real-time match score updates
- [ ] **Mobile App Optimization**: Improve mobile performance and UX
- [ ] **Search Functionality**: Global search across matches, news, and media

### Medium Priority
- [ ] **Player Profiles**: Individual player statistics and profiles
- [ ] **Interactive Charts**: Enhanced data visualization with Chart.js or similar
- [ ] **Social Sharing**: Share buttons for matches and news articles
- [ ] **Dark Mode**: Implement dark theme support
- [ ] **Accessibility Improvements**: WCAG 2.1 compliance audit

### Low Priority
- [ ] **Notification System**: Email/push notifications for match updates
- [ ] **Fan Integration**: User accounts for favorite teams/matches
- [ ] **Historical Data**: Import historical seasons data
- [ ] **Multi-language Support**: Internationalization setup
- [ ] **API Documentation**: OpenAPI specification for data endpoints

### Technical Debt
- [ ] **Database Optimization**: Review and optimize database queries
- [ ] **Component Refactoring**: Consolidate similar components
- [ ] **Error Boundaries**: Implement better error handling
- [ ] **Performance Monitoring**: Set up detailed performance tracking
- [ ] **Documentation**: API documentation and developer guides

### Content Management
- [ ] **Season Reviews**: Write comprehensive season reviews for past seasons
- [ ] **Stadium Information**: Complete stadium data and historical information
- [ ] **Team Colors**: Verify and update team color schemes
- [ ] **Competition Icons**: Create or source competition icons
- [ ] **News Sources**: Expand news source integration

### Security and Compliance
- [ ] **Security Audit**: Conduct security review of data handling
- [ ] **GDPR Compliance**: Ensure data privacy compliance
- [ ] **Content Security Policy**: Implement CSP headers
- [ ] **Rate Limiting**: Add API rate limiting for external integrations
- [ ] **Data Backup**: Implement automated database backup strategy

---

## Conclusion

The Tottenham Hotspur Women website represents a comprehensive digital platform for fans to engage with Spurs Women content. The architecture is built for scalability, performance, and maintainability, with a focus on providing rich, interactive experiences while maintaining clean code organization and efficient data management.

The modular component structure, robust caching system, and comprehensive data layer provide a solid foundation for future enhancements and feature additions. The existing TODO list outlines clear paths for improvement while maintaining the high quality and user experience standards already established.

For technical questions or development guidance, refer to the component-specific documentation files in the `reference/spurs-women/` directory or contact the development team.
