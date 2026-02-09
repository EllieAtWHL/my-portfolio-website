# Caching Implementation Brief – Spurs Women Fan Site

## Goal

Implement server-side caching to reduce repeated data fetching, improve page load times, and minimise external API or database calls. Caching should be safe, predictable, and easy to invalidate when content changes.

The site is read-heavy and write-light, so caching should strongly favour reads.

---

## What Should Be Cached

Cache **derived, read-only data**, not raw user input.

### 1. Match Data
- Fixtures and results
- Scores, goal scorers, competition, season
- Historical matches (longer cache duration)

### 2. Aggregated Views
- Season summaries
- League tables (if applicable)
- Lists such as:
  - All matches for a season
  - All goalscorers
  - Recent matches

### 3. Content Pages
- News posts
- Opinion pieces
- Match reports
- Static content (About, etc.)

### 4. Navigation Data
- Season lists
- Competition lists

### Do Not Cache
- Admin or edit views
- Draft content
- Any user-specific state (if added later)

---

## Cache Type and Location

Use **server-side caching**, not browser-only caching.

### Preferred options (in order)

1. **Vercel Data Cache / Edge Cache**
   - Use Next.js `fetch` caching with `revalidate`
   - Or `unstable_cache` / `cache()` where appropriate

2. **In-memory cache (Node-level)**
   - Acceptable for development
   - Not reliable across serverless invocations, so not the primary strategy

Do **not** introduce Redis yet. Design the solution so Redis could be added later if required.

---

## Cache Keys

Cache keys must be **explicit and deterministic**.

### Pattern

<entity>:<season>:<competition>:<variant>

### Examples
- matches:2024-25:wsl:all
- matches:2024-25:fa-cup:recent
- article:slug:spurs-v-arsenal-away
- season-summary:2024-25

---

## Cache Duration (Revalidation Strategy)

Use **time-based revalidation**, with different TTLs per data type.

### Suggested defaults

- Static content (articles, history): 24 hours
- Current season match lists: 10–30 minutes
- Live or same-day match data: 1–5 minutes
- Past seasons: 7 days or effectively static

---

## Cache Invalidation Rules

Invalidate cache when:
- Content is published or updated
- Admin actions modify data

Prefer tag-based revalidation (revalidateTag) and avoid blanket purges.

---

## Data Access Pattern

All data fetching must go through a **single data access layer** under /lib/data.

Pages and components must never fetch data directly.

---

## Error Handling

Serve stale cache on failure, log errors server-side, and do not break pages.

---

## Non-Goals

- Client-side caching libraries
- Redis or external cache stores
- User-personalised caching
- Offline support
