# Cache Deployment Guide

## Environment Variables

Add these to your production environment:

```bash
# Cache API key for revalidation endpoints
CACHE_API_KEY=your-secure-random-api-key-here
```

## Production Cache Monitoring

### Cache Hit/Miss Monitoring

The cache system now logs:
- Cache hits with timing
- Cache misses and errors  
- Fallback attempts

Monitor these logs in your production environment to track cache performance.

### API Endpoint Security

The cache revalidation endpoints are now protected:

```bash
# Revalidate specific tags
curl -X POST https://your-domain.com/api/cache/revalidate \
  -H "Authorization: Bearer $CACHE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["matches", "news"]}'

# Revalidate all caches
curl -X POST https://your-domain.com/api/cache/revalidate-all \
  -H "Authorization: Bearer $CACHE_API_KEY"
```

## Cache Invalidation Strategy

### Automatic Invalidation

Use the `cache-invalidation.ts` utilities when data changes:

```typescript
import { invalidateMatchCache, invalidateNewsCache } from '@/lib/data';

// When a match is updated
invalidateMatchCache(seasonId, competitionId);

// When news is updated
invalidateNewsCache();
```

### Manual Invalidation

For emergencies or bulk updates, use the API endpoints.

## Cache TTL Values

- **Static Content**: 24 hours
- **Current Season Matches**: 30 minutes  
- **Live Match Data**: 5 minutes
- **Past Seasons**: 7 days
- **YouTube Videos**: 1 hour
- **RSS Feeds**: 24 hours
- **Media**: 6 hours

## Error Handling

The cache system now:
- Logs all cache operations with timing
- Falls back to direct database fetch on cache errors
- Throws descriptive `CacheError` exceptions when both cache and fallback fail
- Never returns empty arrays to mask failures

## Performance Recommendations

1. **Warm up caches** after deployments by hitting key pages
2. **Monitor cache hit rates** - aim for >80% on frequently accessed data
3. **Set up alerts** for cache error spikes
4. **Use the API endpoints** for cache invalidation instead of server restarts

## Testing Cache Functionality

```bash
# Test cache hit (second request should be faster)
time curl -s https://your-domain.com/api/spurs-women-news > /dev/null
time curl -s https://your-domain.com/api/spurs-women-news > /dev/null

# Test cache invalidation
curl -X POST https://your-domain.com/api/cache/revalidate \
  -H "Authorization: Bearer $CACHE_API_KEY" \
  -d '{"tags": ["news"]}'
```

## Troubleshooting

### Common Issues

1. **Cache not working**: Check server logs for "Cache BYPASS (client-side)" messages
2. **High cache miss rate**: Verify cache tags and TTL values
3. **Stale data**: Use revalidation API or check automatic invalidation
4. **Unauthorized errors**: Verify CACHE_API_KEY is set and correct

### Log Patterns to Watch

- `Cache HIT:` - Good performance
- `Cache ERROR:` - Investigate immediately  
- `Cache FALLBACK:` - Cache unavailable but working
- `Cache FALLBACK FAILED:` - Critical - both cache and DB failed
