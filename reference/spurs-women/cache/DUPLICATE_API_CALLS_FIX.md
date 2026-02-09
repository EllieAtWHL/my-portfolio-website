# Fix for Duplicate API Calls

## Problem Identified
You were seeing duplicate API calls like:
```
GET /api/cache/matches/upcoming?limit=3 200 in 16ms
GET /api/cache/matches/upcoming?limit=3 200 in 11ms
```

## Root Cause
The `/spurs-women` page was a **client component** (`'use client'`) that:
1. Used `useEffect` to fetch data on mount
2. React's development mode hot-reload caused the component to re-mount
3. Each re-mount triggered the `useEffect` again → duplicate API calls

## Solution Applied
Converted the page from **client component** to **server component**:

### Before (Client Component)
```tsx
'use client';
export default function HomePage() {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  
  useEffect(() => {
    // Client-side API calls
    const contentData = await getHomePageContentClient();
    setUpcomingMatches(contentData.upcoming);
  }, []);
}
```

### After (Server Component)
```tsx
export default async function HomePage() {
  // Server-side data fetching with caching
  const contentData = await getHomePageContent();
  const { upcoming, previous, news, videos, podcasts } = contentData;
}
```

## Benefits of the Fix

### ✅ Eliminates Duplicate Calls
- Data fetched once on server during rendering
- No client-side API calls needed
- No React hot-reload duplication

### ✅ Better Performance
- **Server-side rendering** with cached data
- **Faster page loads** - data already available
- **Reduced client-side JavaScript**

### ✅ Better SEO
- Content rendered on server
- Search engines can see content immediately
- Better Core Web Vitals

### ✅ Simplified Code
- No loading states needed
- No useState/useEffect complexity
- Cleaner, more maintainable code

## Cache Behavior Now

### Before (Client-side)
```
GET /spurs-women                    # Page load
GET /api/cache/matches/upcoming    # API call 1
GET /api/cache/matches/previous    # API call 2
GET /api/spurs-women-news          # API call 3
# React hot-reload
GET /api/cache/matches/upcoming    # API call 4 (duplicate!)
GET /api/cache/matches/previous    # API call 5 (duplicate!)
```

### After (Server-side)
```
GET /spurs-women                    # Single page load
Cache HIT: matches:upcoming in 4ms   # Server-side cache hits
Cache HIT: matches:previous in 0ms
Cache HIT: news:spurs-women in 15ms
# No duplicate calls!
```

## Files Modified
1. `/src/app/spurs-women/page.tsx` - Converted to server component
2. `/src/lib/data/news.ts` - Updated `getHomePageContent()` to include matches

## Monitoring the Fix
You should now see in your logs:
- ✅ **Single cache hits** per page load
- ✅ **No duplicate API calls**
- ✅ **Faster response times** (server-side rendering)

## Production Impact
This fix will significantly improve:
- **Page load performance**
- **Server efficiency** (fewer API calls)
- **User experience** (instant content display)
- **SEO rankings** (server-rendered content)
