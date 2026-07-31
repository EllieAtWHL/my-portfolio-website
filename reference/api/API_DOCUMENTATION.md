# API Documentation

This document describes all public API endpoints available on ellieatwhl.co.uk.

## Base URL
```
https://www.ellieatwhl.co.uk/api
```

## Overview
All endpoints below are publicly accessible with no authentication and return JSON data. The APIs are primarily focused on Tottenham Hotspur Women's content: news, videos, podcasts, seasons, and match information.

The site also exposes `/api/cache/revalidate` and `/api/cache/revalidate-all`, which are **not public** — they require a `Bearer` token matching the server's `CACHE_API_KEY` and are used internally to invalidate cached data. They are not documented here.

---

## Public Endpoints

### 1. Spurs Women News
**GET** `/spurs-women-news`

Fetches the latest Tottenham Hotspur Women news by aggregating and filtering multiple RSS feeds live on each request.

#### Response
```json
{
  "news": [
    {
      "title": "Article title",
      "link": "https://example.com/article",
      "pubDate": "Wed, 15 Feb 2026 10:30:00 GMT",
      "content": "Full article content...",
      "contentSnippet": "Brief article summary...",
      "guid": "unique-article-id",
      "isoDate": "2026-02-15T10:30:00.000Z",
      "source": "BBC Sport",
      "categories": ["Women's Team"]
    }
  ]
}
```

#### Details
- **Caching**: None — every request fetches all source feeds live
- **Sources**: Spurs Women Blog, Veinte Futbol, Spurs Across the Pond, BBC Sport, WSL Full-Time, She Kicks, The Guardian, Cartilage Free Captain, Girls on the Ball
- **Filtering**: Content is filtered to Spurs Women related articles based on source, category, and keyword matching
- **`categories`**: Only present for feeds that publish RSS categories; otherwise an empty array
- **Limit**: Returns up to 20 most recent articles, newest first

---

### 2. Spurs Women Videos
**GET** `/spurs-women-videos`

Fetches the latest Tottenham Hotspur Women videos from the official YouTube channel.

#### Response
```json
{
  "videos": [
    {
      "title": "Video title",
      "link": "https://www.youtube.com/watch?v=VIDEO_ID",
      "pubDate": "Wed, 15 Feb 2026 10:30:00 GMT",
      "videoId": "VIDEO_ID",
      "thumbnail": "https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg",
      "description": "Video description..."
    }
  ],
  "count": 6,
  "lastUpdated": "2026-02-15T10:30:00.000Z"
}
```

#### Details
- **Caching**: None — fetched live from the channel's RSS feed on each request
- **Source**: Official Tottenham Hotspur Women YouTube channel
- **Limit**: Returns up to 6 most recent videos

---

### 3. Podcasts
**GET** `/podcasts`

Fetches the latest episode from each Spurs Women related podcast.

#### Response
```json
{
  "episodes": [
    {
      "title": "Episode title",
      "episodeNumber": "N17 Women",
      "description": "Episode description...",
      "duration": "45:30",
      "publishDate": "15 Feb 2026",
      "url": "https://shows.acast.com/n17women/episodes/episode-slug",
      "podcastName": "N17 Women"
    }
  ]
}
```

#### Details
- **Caching**: None — fetched live on each request
- **Podcasts**: N17 Women, Hometown Glory
- **Episodes**: Latest episode from each podcast (not a combined, paginated feed)
- **`episodeNumber`**: Despite the name, this currently just holds the podcast's name (e.g. `"N17 Women"`), the same value as `podcastName` — not a numbered episode identifier

---

### 4. Upcoming Matches
**GET** `/cache/matches/upcoming`

Fetches upcoming Tottenham Hotspur Women matches. Despite the `/cache/` path segment (shared with the internal cache-management routes), this endpoint itself is public and unauthenticated.

#### Parameters
- `limit` (optional): Number of matches to return (default: `3`)

#### Response
```json
{
  "matches": [
    {
      "id": "482",
      "date": "2026-08-20T19:00:00.000Z",
      "kickoff_time": "19:00",
      "home_team": {
        "id": 3,
        "name": "Tottenham Hotspur",
        "short_name": "Spurs",
        "primary_color": "#132257",
        "secondary_color": "#ffffff",
        "is_tottenham": true
      },
      "away_team": {
        "id": 7,
        "name": "Arsenal",
        "short_name": "Arsenal",
        "primary_color": "#EF0107",
        "secondary_color": "#ffffff",
        "is_tottenham": false
      },
      "spurs_score": null,
      "opponent_score": null,
      "spurs_score_aet": null,
      "opponent_score_aet": null,
      "spurs_score_pens": null,
      "opponent_score_pens": null,
      "attended": false,
      "is_home_match": true,
      "is_neutral_venue": false,
      "stadium_id": "12",
      "stadium_display_name": "Brisbane Road",
      "stadium_slug": "brisbane-road",
      "attendance": null,
      "notes": null,
      "competitions": { "name": "Women's Super League", "icon_svg": null },
      "season_id": 12,
      "home_possession": null,
      "away_possession": null,
      "home_total_shots": null,
      "away_total_shots": null,
      "home_shots_on_target": null,
      "away_shots_on_target": null,
      "home_corners": null,
      "away_corners": null
    }
  ]
}
```

#### Details
- **Cache**: 30 minutes (server-side, tag-based revalidation)
- **Default limit**: 3 matches
- **Sorting**: Chronological (soonest first)
- **Scores/stats fields**: `null` until the match is played or data is entered; `_aet`/`_pens` fields are only populated for matches decided after extra time or penalties

---

### 5. Previous Matches
**GET** `/cache/matches/previous`

Fetches previous Tottenham Hotspur Women matches. Same response shape as [Upcoming Matches](#4-upcoming-matches), typically with `spurs_score`/`opponent_score` and match statistics populated.

#### Parameters
- `limit` (optional): Number of matches to return (default: `3`)

#### Details
- **Cache**: 30 minutes (server-side, tag-based revalidation)
- **Default limit**: 3 matches
- **Sorting**: Reverse chronological (most recent first)

---

### 6. Seasons
**GET** `/seasons`

Fetches all seasons with match counts.

#### Response
```json
{
  "seasons": [
    {
      "id": 12,
      "name": "2025-26",
      "match_count": 18
    },
    {
      "id": 11,
      "name": "2024-25",
      "match_count": 25
    }
  ],
  "count": 5
}
```

#### Details
- **Cache**: 24 hours (server-side, tag-based revalidation)
- **Data**: All seasons with a count of matches recorded for each
- **Sorting**: Most recent season first
- **Note**: There is no "is this the active season" flag in the response — infer the current season by the most recent `id`/start date

---

## Error Handling

All endpoints return a consistent shape on failure:

```json
{
  "error": "Error description"
}
```

Endpoints that return a collection (`matches`, `seasons`, `videos`) also include an empty array for that field on error, so consumers don't need to special-case a missing key.

### Common Status Codes
- **200**: Success
- **500**: Server error (external feed/API unavailable, database error)

## Rate Limiting

Currently no rate limiting is implemented. Please use the APIs responsibly.

## Caching

Only the database-backed endpoints (matches, seasons) are cached server-side. The RSS/YouTube/podcast aggregation endpoints (news, videos, podcasts) are **not cached** and fetch their upstream sources on every request:

| Endpoint | Cached? | Duration |
|---|---|---|
| News | No | — |
| Videos | No | — |
| Podcasts | No | — |
| Upcoming/Previous Matches | Yes | 30 minutes |
| Seasons | Yes | 24 hours |

## Usage Examples

### Fetch latest news
```bash
curl https://www.ellieatwhl.co.uk/api/spurs-women-news
```

### Fetch latest videos
```bash
curl https://www.ellieatwhl.co.uk/api/spurs-women-videos
```

### Fetch all endpoints
```bash
curl https://www.ellieatwhl.co.uk/api/spurs-women-news
curl https://www.ellieatwhl.co.uk/api/spurs-women-videos
curl https://www.ellieatwhl.co.uk/api/podcasts
curl https://www.ellieatwhl.co.uk/api/cache/matches/upcoming
curl https://www.ellieatwhl.co.uk/api/cache/matches/previous
curl https://www.ellieatwhl.co.uk/api/seasons
```

### Fetch matches with a custom limit
```bash
curl "https://www.ellieatwhl.co.uk/api/cache/matches/upcoming?limit=5"
curl "https://www.ellieatwhl.co.uk/api/cache/matches/previous?limit=10"
```

## Data Sources

- **News**: Multiple RSS feeds (BBC Sport, The Guardian, Spurs Women Blog, and others — see [Spurs Women News](#1-spurs-women-news))
- **Videos**: Official Tottenham Hotspur Women YouTube channel
- **Podcasts**: N17 Women, Hometown Glory (via Acast)
- **Matches/Seasons**: Internal Supabase database

## Support

For issues or questions about the APIs, please refer to the project documentation or contact the development team.
