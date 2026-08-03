# Spurs Women Caching

Server-side caching for the read-heavy, write-light Spurs Women site, built on
Next.js `unstable_cache` with tag-based invalidation. Goal: reduce repeated
Supabase/RSS/YouTube calls and improve page load times, while staying safe and
predictable to invalidate when content changes.

**Implementation**: `src/lib/data/cache-utils.ts`

## What's Cached

Cache **derived, read-only data**, not raw user input:

- **Match data**: fixtures, results, scores, competition/season info
- **Aggregated views**: season summaries, match lists
- **Content**: news, podcasts, static pages
- **Navigation data**: seasons, competitions, stadiums (incl. stadium name history)

**Never cached**: admin/edit views, draft content, any user-specific state.

All data fetching goes through the data access layer under `src/lib/data/` -
pages and components should never fetch data directly.

## Cache TTLs

| Data | TTL |
|------|-----|
| Static content (teams, seasons, competitions), stadium data | 24 hours |
| Current season matches & statistics | 30 minutes |
| Past-season matches | 7 days |
| Live match data | 5 minutes |
| RSS feeds (news, podcasts) | 24 hours |
| YouTube videos | 1 hour |
| Media (photos, articles, social posts) | 6 hours |
| Player data | 1 hour |
| Player statistics | 30 minutes |

These correspond to the `CACHE_TTL` constants in `cache-utils.ts` (`STATIC_CONTENT`, `CURRENT_SEASON_MATCHES`, `PAST_SEASONS`, `LIVE_MATCH_DATA`, `RSS_FEEDS`, `YOUTUBE_VIDEOS`, `MEDIA`, `STADIUM_DATA`, `TEAM_DATA`, `PLAYER_DATA`, `PLAYER_STATS`).

## Cache Keys

Keys are built from a `keyParts: string[]` array joined with `:` (see `createCachedFunction` in `cache-utils.ts`). In practice, most domains use short, static prefixes rather than embedding the actual entity value:

```
matches:upcoming
matches:previous
matches:season
match:id
stadium:by-slug
stadium-names:by-stadium-id
```

A separate `CACHE_KEYS` helper (`cache-utils.ts`) *can* build dynamic, value-bearing keys like `matches:2024-25:wsl:all` or `stadium:by-slug:tottenham-hotspur-stadium`, but today it's only actually used by `news.ts` (for `news`, `videos`, `podcasts` keys) - `matches.ts` and `stadiums.ts` use their own fixed `keyParts` arrays instead, so the logged/visible cache key for those domains doesn't currently include the season, competition, or slug value.

## Invalidation

Prefer tag-based revalidation (`revalidateTag`) over blanket purges. Use the
`cache-invalidation.ts` utilities when data changes:

```typescript
import { invalidateMatchCache, invalidateNewsCache } from '@/lib/data';

invalidateMatchCache(seasonId, competitionId); // match updated
invalidateNewsCache();                          // news updated
```

**Known bug**: `invalidateStadiumCache`/`invalidateAllStadiumCaches`
(`src/lib/data/stadiums.ts`) build a local `cacheKeys` array but never call
`revalidateTag`/`revalidateCacheTags` with it - they are currently no-ops that
have no effect on the cache. Stadium/stadium-name edits in the admin UI do not
actually invalidate the cache today. Don't rely on these functions until
they're fixed to call `revalidateCacheTags([CACHE_TAGS.STADIUMS])` (or
equivalent) - use the manual revalidation API below as a workaround in the
meantime.

For emergencies or bulk updates, use the API endpoints instead of a server
restart:

```bash
# Revalidate specific tags
curl -X POST https://your-domain.com/api/cache/revalidate \
  -H "Authorization: Bearer $CACHE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["matches", "news", "stadiums", "stadium-names"]}'

# Revalidate everything
curl -X POST https://your-domain.com/api/cache/revalidate-all \
  -H "Authorization: Bearer $CACHE_API_KEY"
```

## Deployment

### Environment variables

```bash
CACHE_API_KEY=your-secure-random-api-key-here
```

The cache revalidation endpoints require this key - there is no default key in
production (an earlier dev-only default has been removed; always set this
explicitly).

### Error handling

- Cache failures fall back to a direct database fetch
- Falls back to fresh data on error rather than serving broken state
- Throws a descriptive `CacheError` when both cache and fallback fail (never silently returns an empty array to mask a failure)
- All cache operations are logged with timing

### Monitoring

Watch server logs for these patterns:

| Log | Meaning |
|-----|---------|
| `Cache HIT:` | Good - served from cache |
| `Cache ERROR:` | Investigate immediately |
| `Cache FALLBACK:` | Cache unavailable, but DB fallback worked |
| `Cache FALLBACK FAILED:` | Critical - both cache and DB failed |
| `Cache BYPASS (client-side)` | Expected if a client component tries to read cache directly |

Aim for >80% cache hit rate on frequently-accessed data; warm up caches after
deployments by hitting key pages.

```bash
# Rough hit-rate check: second request should be noticeably faster
time curl -s https://your-domain.com/api/spurs-women-news > /dev/null
time curl -s https://your-domain.com/api/spurs-women-news > /dev/null
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Cache not working | Check logs for `Cache BYPASS (client-side)` |
| High cache miss rate | Verify cache tags and TTL values match the table above |
| Stale data | Use the revalidation API, or check that automatic invalidation is wired up for that data type |
| `401`/unauthorized on revalidate endpoints | Verify `CACHE_API_KEY` is set and matches the `Authorization: Bearer` header |

## Known Gaps

Not yet implemented (see `reference/spurs-women/DEVELOPMENT_TODO.md` for the
full backlog): cache hit-rate metrics/monitoring dashboard, consolidated cache
API-key auth logic (currently duplicated across routes), cache size/memory
visibility, more granular TTLs than the generic "static content" bucket where
it would help, automated tests for cache behavior and invalidation.
