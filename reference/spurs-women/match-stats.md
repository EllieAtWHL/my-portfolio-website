# Match Statistics System

## Overview
The match statistics system displays key match data in a clean, responsive grid layout with team-colored visual bars. It shows possession, shots, and corners when data is available.

## Components

### MatchStats Component
**Location:** `src/components/spurs-women/MatchStats.tsx`

Displays match statistics in a responsive grid layout with team-colored visual bars.

#### Features
- Mobile-first responsive design (1 column on mobile, 2-3 columns on larger screens)
- Team-colored visual bars using primary/secondary team colors
- Conditional rendering (only shows stats that have data)
- Proportional bar representations for visual comparison

#### Props
```typescript
interface MatchStatsProps {
  possession?: {
    home: number;  // Home team possession percentage (0-100)
    away: number;  // Away team possession percentage (0-100)
  };
  shots?: {
    home: {
      total: number;     // Total shots taken by home team
      onTarget: number;   // Shots on target by home team
    };
    away: {
      total: number;     // Total shots taken by away team
      onTarget: number;   // Shots on target by away team
    };
  };
  corners?: {
    home: number;  // Home team corner kicks
    away: number;  // Away team corner kicks
  };
  homeTeam?: string;
  awayTeam?: string;
  homeTeamColor?: string;  // Tailwind color class for home team bars
  awayTeamColor?: string;  // Tailwind color class for away team bars
}
```

#### Usage
```tsx
<MatchStats 
  possession={{ home: 65, away: 35 }}
  shots={{
    home: { total: 12, onTarget: 6 },
    away: { total: 8, onTarget: 3 }
  }}
  corners={{ home: 7, away: 3 }}
  homeTeamColor="white"
  awayTeamColor="cyan-200"
/>
```

### TeamPill Component
**Location:** `src/components/spurs-women/TeamPill.tsx`

Reusable component for displaying team names in colored pills with proper team branding.

#### Features
- Uses team primary color for background
- Uses team secondary color for text
- Handles CSS override issues with WebkitTextFillColor
- Customizable className for different sizes

#### Props
```typescript
interface TeamPillProps {
  teamName: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  className?: string;
}
```

#### Usage
```tsx
<TeamPill 
  teamName="Tottenham Hotspur"
  primaryColor="white"
  secondaryColor="navy-600"
/>
```

## Utilities

### Team Color Utility
**Location:** `src/lib/utils/team-colors.ts`

Converts Tailwind color class names to CSS hex colors for use in inline styles.

#### Features
- Comprehensive mapping of all Tailwind color variants (50-950)
- Fallback to gray if color not found
- Handles special cases like white teams

#### Function
```typescript
function getTeamColor(colorName?: string): string
```

#### Examples
```typescript
getTeamColor('blue-600')     // Returns '#2563eb'
getTeamColor('cyan-200')     // Returns '#a5f3fc'
getTeamColor('white')        // Returns '#f3f4f6'
getTeamColor('unknown')      // Returns '#6b7280'
```

## Data Integration

### Database Schema
The match statistics are stored in the database with the following columns:

```sql
-- Possession
home_possession   INTEGER
away_possession   INTEGER

-- Shots  
home_total_shots      INTEGER
away_total_shots      INTEGER
home_shots_on_target  INTEGER
away_shots_on_target  INTEGER

-- Corners
home_corners   INTEGER
away_corners   INTEGER
```

### Team Color Data
Team colors are stored in the teams table:

```sql
primary_color   VARCHAR(50)   -- Tailwind color class (e.g., 'blue-600')
secondary_color VARCHAR(50)   -- Tailwind color class (e.g., 'white')
```

## Implementation Details

### Visual Bar Logic
- **Possession bars**: Width proportional to possession percentages
- **Shots bars**: Width proportional to on-target shots (since positioned below on-target numbers)
- **Corner bars**: Width proportional to corner counts

### Responsive Design
- **Mobile (<640px)**: Single column layout
- **Tablet (640px-1024px)**: Two columns
- **Desktop (>1024px)**: Three columns

### Color Handling
- Team primary colors used for bar backgrounds
- Team secondary colors used for pill text
- No automatic contrast adjustment based on lightness - the only special case is `getTeamColor('white')`, which is mapped to a light gray (`#f3f4f6`) rather than pure white for visibility against light backgrounds

## CSS Considerations

### Text Fill Color Override
The TeamPill component includes `WebkitTextFillColor` to override CSS issues with `.spurs-wrapper h1.spurs-text` (in `src/styles/spurs-theme.css`), which applies `-webkit-text-fill-color: transparent` as part of a gradient text-clip effect.

### Bar Styling
All bars use rounded-full styling with `transition-colors` for smooth color transitions (not hover-triggered - the bars have no `:hover` styling of their own).

## Integration Points

### Match Page Integration
The MatchStats component is used in:
- `src/app/spurs-women/matches/[matchId]/page.tsx`

### Team Pill Usage
The TeamPill component is used in:
- `src/components/spurs-women/MatchNavigation.tsx` (page header)
- `src/components/spurs-women/MatchCard.tsx` (match cards)
- `src/app/spurs-women/teams/[teamId]/TeamClient.tsx`
- `src/app/spurs-women/teams/page.tsx`

## Troubleshooting

### Common Issues

#### Text Not Visible in Pills
**Cause:** CSS `.spurs-wrapper h1.spurs-text` applies `-webkit-text-fill-color: transparent`
**Solution:** TeamPill component includes explicit `WebkitTextFillColor` override

#### Wrong Colors Displayed
**Cause:** Tailwind color class not mapped in utility
**Solution:** Add missing color to `getTeamColor` mapping in `src/lib/utils/team-colors.ts`

#### Stats Not Showing
**Cause:** No data in database columns
**Solution:** Verify database has values for possession, shots, and corners columns

## Future Enhancements

### Potential Additions
- Additional statistics (fouls, cards, offsides)
- Historical comparison data
- Interactive chart visualizations
- Export functionality for statistics

### Component Extensibility
The MatchStats component is designed to easily accommodate new statistics by:
- Adding new optional props to the interface
- Creating new StatCard instances
- Following the existing bar pattern for visual representation
