# Season Statistics Calculations Documentation

This document explains how each statistic in the SeasonStats component is calculated.

## Data Filtering

### Competition Classification

Matches are filtered into three categories based on the `competitions.name` field:

1. **League Matches (WSL)**: `competitions.name.toLowerCase().includes('super league')`
   - Includes: "Womens Super League"
   - Used for all primary statistics (wins, draws, losses, goals, etc.)

2. **Cup Matches**: Completed matches that are NOT league matches and NOT friendlies
   - Includes: "Women's League Cup", "Women's FA Cup", etc.
   - Used for separate cup statistics

3. **Friendlies**: Matches with "friendly" in competition name
   - **Completely ignored** from all statistics calculations

4. **Completed Matches**: Must have both `spurs_score` and `opponent_score` not null

## League Statistics (WSL)

### Basic Record
- **Total Matches**: `leagueMatches.length`
- **Wins / Draws / Losses**: count of `getMatchResult(match)` returning `'W'` / `'D'` / `'L'` (see "Results: extra time and penalties" below)
- **Win Percentage**: `(wins / totalMatches) * 100`
- **Points Per Game**: `((wins * 3 + draws) / totalMatches)`

### Goal Statistics
- **Goals Scored**: sum of `getFinalScore(match).spurs`
- **Goals Conceded**: sum of `getFinalScore(match).opponent`
- **Goal Difference**: `goalsScored - goalsConceded`
- **Clean Sheets**: matches where `getFinalScore(match).opponent === 0`
- **Goals Per Game**: `goalsScored / totalMatches`

## Results: extra time and penalties

Every result on the site (this component, the team page's head-to-head /
overall record, the match list's Result filter, `getSeasonStats` in
`src/lib/data/seasons.ts`, and the MCP tools) goes through the shared helpers in
`src/lib/utils/match-result.ts` rather than comparing scores inline:

- `spurs_score`/`opponent_score` hold the **90-minute** score; the score after
  extra time is in `spurs_score_aet`/`opponent_score_aet`.
- `getFinalScore(match)` returns the deciding score: the AET score when both
  AET columns are set, otherwise the 90-minute score. It returns `null` for an
  unscored match.
- `getMatchResult(match)` compares that deciding score, so a tie that was 1-1
  at 90 minutes and 2-1 after extra time is a **win**, not a draw.
- A **penalty shootout doesn't change the result**: a match still level after
  extra time counts as a draw, as is the usual record-keeping convention. The
  shootout winner is reported separately by `getShootoutWinner`.
- Goals scored/conceded include extra-time goals but not shootout penalties.

League matches never go to extra time, so this only changes cup figures in
practice. Don't reintroduce `spurs_score > opponent_score` comparisons (that
was WEB-253: extra-time wins showed up as draws).

## Cup Statistics (calculated, not currently displayed)

Cup wins/draws/losses/goals-scored/goals-conceded are computed the same way
as the league equivalents above, from `cupMatches`, and included in the
component's internal `stats` object - but **`renderContent()` never renders
them**. There is no "Cup Record" section in the UI today (see "Component
Structure" below); this is dead computation, not a display bug, until/unless
a cup section is added.

- **Total Cup Matches**: `cupMatches.length`
- **Cup Wins / Draws / Losses**: count of `getMatchResult(match)` over `cupMatches`
- **Cup Goals Scored / Conceded**: sum of `getFinalScore(match).spurs` / `.opponent` over `cupMatches`
- **Cup Goal Difference**: `cupGoalsScored - cupGoalsConceded`

## Match Stats (displayed, league matches only)

Averages of the per-match team-stat columns (`home_*`/`away_*` on `matches`),
picking the Spurs-side column based on `is_home_match`, over league matches
that have at least one of `home_possession`/`away_possession` set
(`matchesWithStats`):

- **Average Possession**: sum of Spurs' possession % across `matchesWithStats`, divided by `matchesWithStats.length`
- **Average Total Shots**: same pattern, using `home_total_shots`/`away_total_shots`
- **Average Shots on Target**: same pattern, using `home_shots_on_target`/`away_shots_on_target`
- **Average Corners**: same pattern, using `home_corners`/`away_corners`
- **Shot Accuracy** (derived, not stored): `averageShotsOnTarget / averageTotalShots * 100`, shown as `0.0%` if `averageTotalShots` is `0`

All null stat columns count as `0` in the sum (`|| 0`), and a match is only
included at all if at least one possession value is non-null.

## Attendance Statistics

**Note**: Attendance includes ALL attended competitive matches (both league and cup competitions)

### Attendance Tracking
- **All Competitive Matches**: `[...leagueMatches, ...cupMatches]`
- **Games Attended**: `allCompetitiveMatches.filter(match => match.attended).length`

### Attendance Rate Display
- **Fraction Format**: `${attendedMatches}/${allCompetitiveMatches.length}`
  - Uses ALL competitive matches count for denominator (league + cups)
- **Percentage**: `((attendedMatches / allCompetitiveMatches.length) * 100).toFixed(1)%`

**Note**: Average and total attendance are calculated internally but not displayed in the UI for a cleaner interface.

## Component Structure

The SeasonStats component consists of:

1. **Header**: "Season Statistics" title with expand/collapse button
2. **Statistics Card**: Detailed breakdown (only visible when expanded)

### Header Features
- Clean title and button layout
- Compact xs-sized button with thick icon strokes
- Expand/collapse functionality with proper accessibility labels

### Statistics Sections
- **League Record**: WSL matches performance
- **Goals**: League goal statistics  
- **Match Stats**: Average possession, total shots, shots on target, corners, and shot accuracy (league matches only - see "Match Stats" above; there is no separate Cup Record section, despite cup stats being computed internally)
- **Attendance**: All competitive matches attendance

## Important Notes

1. **League Only for Primary Stats**: All main statistics (win rate, points per game, etc.) are calculated ONLY from league matches to provide meaningful competitive performance metrics.

2. **Friendlies Excluded**: Friendly matches are completely ignored as they don't represent competitive performance.

3. **Attendance Includes All**: Attendance statistics include both league and cup matches since attendance tracking applies to any attended game.

4. **Null Handling**: All calculations handle null/undefined scores and attendance values gracefully.

5. **Rounding**: 
   - Win percentage: 1 decimal place
   - Points per game: 2 decimal places
   - Goals per game: 2 decimal places
   - Attendance percentage: 1 decimal place
   - Average attendance: Rounded to nearest whole number

## Example Calculation

Given these matches:
- 15 WSL matches: 8 wins, 4 draws, 3 losses, 24 goals scored, 14 conceded
- 5 cup matches: 2 wins, 1 draw, 2 losses, 8 goals scored, 6 conceded
- 12 total attended matches

Results:
- **League**: 15 matches, 53.3% win rate, 1.87 points/game, +10 GD
- **Cups**: 5 matches, 40% win rate, +2 GD (computed but not shown in the UI - see "Cup Statistics" above)
- **Attendance**: 12/20 attended (60.0%) - includes all competitive matches

**Note**: The component displays these statistics in four organized sections (League Record, Goals, Match Stats, Attendance) with expand/collapse functionality.
