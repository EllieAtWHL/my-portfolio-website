# Trick or Trailhead Badge Checker — Requirements & Plan

Oct 31, 2026 · @Ellie Matthewman

## Overview

A public page on the portfolio where anyone types a Trailhead username and sees which Trick or Trailhead badges they've earned out of every one that has existed, e.g. "7 of 12". No such tool exists today: Trailhead profiles show what you have, never what you're missing.

It lives at `/salesforce/trick-or-trailhead`, in a new `/salesforce` section that the existing Salesforce pages move into first (see Salesforce section move below).

Status: Jira issues raised under epic [WEB-228](https://eleanormatthewman.atlassian.net/browse/WEB-228) (see Delivery plan). **Being built but not launched:** the Salesforce Program Agreement prohibits automated retrieval without written consent (see "Terms of use" below). The feature is kept off production until Ellie has permission or decides to accept the risk ([WEB-234](https://eleanormatthewman.atlassian.net/browse/WEB-234)). Nothing is built yet. The Trailhead endpoint was tested live on Oct 31, 2026 from a local machine (not yet from Vercel); the findings are in "Live API findings" below and change several earlier targets.

## Goals and non-goals

**Goals**

- Look up any public Trailhead profile by username and show earned vs missing Trick or Trailhead badges.
- Show every badge with its year, name and artwork, so the collection reads as a set.
- Fail clearly and gracefully when the profile is private, the username doesn't exist, or Trailhead changes its API.
- Be cheap to keep running: one new badge entry each October, no paid services, no database.

**Non-goals (v1)**

- Other badge types (superbadges, other event badges, certifications). Trick or Trailhead only for now.
- Accounts, saved lookups, leaderboards or comparing users.
- Storing anyone's lookup history.
- An official Salesforce integration or OAuth; only public profile data is used.
- Telling people how to earn missing badges; past event badges usually can't be earned any more.
- A write-up of how the tool was built (the other Salesforce projects were built by hand and have that story; this one doesn't need it).
- A scheduled live check of the Trailhead API; manual checks are enough for now.

## User stories and functional requirements

| ID | As a… | I want to… | Acceptance criteria |
| --- | --- | --- | --- |
| FR-1 | visitor | enter a Trailhead username and check it | Accepts a bare username or a pasted profile URL (`trailblazer.me/id/…`, `salesforce.com/trailblazer/…`) and extracts the username. Trims whitespace. Rejects empty or invalid characters before calling the API. |
| FR-2 | visitor | see every Trick or Trailhead badge, earned or not | Grid of all catalogue badges, newest year first. Earned badges in full colour with an "Earned" label; missing ones greyed out with a "Missing" label (not colour alone). |
| FR-3 | visitor | see a summary score | Headline like "7 of 12 Trick or Trailhead badges", plus the profile's display name and avatar (agreed: shown when the profile provides them). |
| FR-4 | visitor | share my result | The username goes in the URL (`/salesforce/trick-or-trailhead?u=username`) so a result can be shared and reloaded. |
| FR-5 | visitor | browse the set without a username | With no username, the page shows the full catalogue as a gallery with a lookup prompt. |
| FR-6 | visitor with a private profile | understand why nothing showed | Distinct messages for: profile private, username not found, too many requests, Trailhead unavailable or changed. Each says what to do next. |
| FR-7 | Ellie | add next year's badge | Adding a badge is a single entry in a data file, no code changes. The README documents how to find the matching key. |
| FR-8 | visitor | spot badges the catalogue doesn't know about | Earned Trick or Trailhead-like event badges that match no catalogue entry are listed under "Other Halloween badges" so gaps in the catalogue surface instead of disappearing. |

## Non-functional requirements

| Area | Requirement |
| --- | --- |
| Server-side only | All Trailhead calls run in a Next.js API route, never in the browser. Avoids CORS, keeps the query shape out of client code, and needs no new browser CSP entry. |
| Caching | Results cached per username via the existing `createCachedFunction` / `unstable_cache` pattern. TTL: 24 hours (badges rarely change, and a cold lookup is expensive; was 1 hour before the live findings). Expected outcomes (found, not found, private) are returned as values, not thrown, because `unstable_cache` doesn't cache thrown errors. Found and not-found results are cached; private and rate-limited results are **not** cached (or cached for at most a minute), so someone who makes their profile public can retry straight away. Badge artwork cached by the browser/CDN. |
| Rate limiting | Route uses `rateLimitResponse` from `src/lib/rate-limit.ts`, like `/api/podcasts`. 10 lookups per IP per minute (agreed; revisit after launch). Trailhead's own limit (~200 requests/min per IP) is shared by every lookup, because Vercel functions share a few outbound IPs; see Live API findings. |
| Upstream politeness | At most one full paginated fetch per username per TTL. Page size 50 (larger pages silently drop awards). Page cap 40 per award type (2,000 awards). Stop early once every catalogue badge of that type is found. Per-request timeout 8s. On a 429 or `TOO_MANY_REQUESTS`, stop and report "too many requests" rather than retrying in a loop. |
| Resilience | Upstream response validated against a schema. Shape mismatch → logged and reported as "Trailhead changed something", never a crash or a silently empty grid. Any `award: null` node is treated as a failure (it means awards were dropped), never skipped, because skipping it would silently mark an earned badge as missing. Catalogue gallery still renders when the API is down. |
| Performance | Page shell and catalogue are server-rendered and static; only the lookup is dynamic. A cached lookup is instant. A cold lookup takes about 1s per 50 awards, so 10–20s for an active Trailblazer (18s measured for a profile with 628 modules). The loading state is designed for that wait, and the route's `maxDuration` allows it. |
| Accessibility | WCAG 2.1 AA: labelled input, earned/missing shown by text and icon as well as colour, results announced via an `aria-live` region, badge images have alt text. |
| Privacy | No lookups stored or logged with usernames beyond normal request logs. Only public profile data is shown. |
| Styling | Follows `reference/CSS_ARCHITECTURE.md`: a page-specific CSS file, colours via CSS variables, dark mode supported, shared `Button` component. |
| Branding | Badge artwork is Salesforce's. Show it as earned-badge imagery with clear "unofficial, not affiliated with Salesforce" wording; don't use Trailhead logos as primary page design. |

## Data sources

Two sources are needed: an unofficial API for what a user has earned, and a hand-curated list of every badge that exists, since nothing official provides one.

**1. Earned badges: Trailhead profile GraphQL (unofficial)**

- Endpoint: `POST https://profile.api.trailhead.com/graphql`, JSON body, no auth. This is the API Trailhead's own profile pages use.
- Operation `GetTrailheadBadges` with variables `slug` (username), `hasSlug: true`, `count`, `after` (cursor) and `filter` (`AwardTypeFilter`: `MODULE`, `PROJECT`, `SUPERBADGE`, `EVENT`, `STANDALONE`).
- Paginated via `earnedAwards(first, after, awardType)` returning `pageInfo { endCursor, hasNextPage }`; default page size 8.
- Profile must be public.
- Reference implementations:
  - [meruff/go-trailhead-leaderboard-api](https://github.com/meruff/go-trailhead-leaderboard-api) (its `trailhead/queries.go` holds the full query).
  - [nabondance/Trailhead-Banner](https://github.com/nabondance/Trailhead-Banner) (BSD-3-Clause, actively maintained, Next.js on Vercel): `src/graphql/queries/getTrailheadBadges.js` for the query, `src/utils/graphqlUtils.js` and `src/utils/companyFetchUtils.js` for error and rate-limit handling, `src/utils/usernameValidation.js` for username parsing. Its error handling and username parsing are worth reusing, credited under its licence.
- Verified live on Oct 31, 2026, both from a local machine and from a Vercel preview deployment (WEB-230 spike).

**Live API findings (Oct 31, 2026)**

Tested against `elliematthewman` (871 badges: 123 `EVENT`, 628 `MODULE`).

- **Pages over ~50 silently drop awards.** With `first: 100`, 50 of 123 `EVENT` awards came back as `award: null` with no error, and Trick or Trailhead VIII disappeared. At 75, 25 of the first page were null. At 25, 30, 40 and 50, none were. With `first: 200` or more, the request is rejected outright ("Query has complexity of 2207, which exceeds max complexity of 2000"). **Use a page size of 50**, and treat any null award as a failure.
- **Pages can't be fetched in parallel.** The cursor is base64 JSON `{"s": <last node id>, "pp": <page size>, "pn": <page number>}`, i.e. keyset pagination, so each page needs the previous page's last ID.
- **Lookups are slow.** Paging through every `EVENT` and `MODULE` award took 16 requests and 18s (about 1s per page). Paging through every award type at a page size of 25 took 35 requests and 32s. Recent editions are `MODULE` awards, so a lookup has to page through a user's modules until it finds them or runs out.
- **From Vercel (preview deployment, region `iad1`, page size 50):** works with no extra headers or tokens. A full `EVENT` + `MODULE` lookup of `elliematthewman` took 16 requests and 11.5s (EVENT 3 pages, 1.6s; MODULE 13 pages, 9.9s; 0.4–0.9s per page), with no null awards and all 7 Trick or Trailhead badges found. A route `maxDuration` of 30s gives enough headroom for profiles about twice that size.
- **Stopping early pays off.** Awards come newest first, and all three Trick or Trailhead modules (2024–2026) were in the first 2 of 13 module pages. A lookup that stops once every catalogue badge of a type is found takes ~2–3s for someone holding the recent badges. Only profiles missing at least one badge need the full scan.
- **Introspection is disabled** (`__type` doesn't exist on `Query`), so the schema can only be learned from working queries.
- **Responses (from Trailhead-Banner, to confirm in the spike):**
  - Unknown username: HTTP 200 with an error whose `extensions.code` is `NOT_FOUND`.
  - Private profile: `profile.__typename === 'PrivateProfile'`.
  - Rate limited: HTTP 429 with no `Retry-After` header, **or** HTTP 200 with `extensions.code` `TOO_MANY_REQUESTS`.
  - Trailhead limits by IP at about 200 requests/min, and Vercel functions share a few outbound IPs, so every lookup draws on one shared budget. At ~16 requests per cold lookup, that's roughly 12 cold lookups a minute across all visitors before Trailhead starts refusing.
- **Confirmed live:** an unknown username returns HTTP 200, `data: null`, and an error with `extensions.code: "NOT_FOUND"` (`statusCode: 404`, "profile could not be found"). A removed or unknown field returns `extensions.code: "undefinedField"`. `PublicProfile` has `name`, `givenName`, `familyName`, `avatarUrl`, `slug`, `title`, `companyName` and `bio` (not `fullName` or `photoUrl`), so name and avatar can come with the first badge page.
- **No direct per-module query:** Trailhead's own profile UI (`@devforce/th-profile-ui` v1.57.0) also only uses `earnedAwards(first, after, awardType)`, with filter values `MODULE`, `PROJECT`, `SUPERBADGE`, `EVENT` and `STANDALONE`.
- **Other endpoints:** `mobile.api.trailhead.com/graphql` (`earnedStamps`) returns event-attendance stamps (Dreamforce, TDX, World Tour), not Trick or Trailhead badges, so it isn't useful here. `community.api.trailhead.com` goes read-only on Oct 30, 2026.

**2. All badges: curated catalogue (in repo)**

A JSON file in the repo, one entry per badge. Proposed fields:

| Field | Example | Purpose |
| --- | --- | --- |
| `year` | 2025 | Sorting and display |
| `title` | A Ghost at Sillicorn Valley Inn | Display name |
| `matchIds` | `["trick-or-trailhead-2025-…"]` | Trailhead API name(s)/IDs used to match earned awards |
| `matchTitles` | `["Trick or Trailhead 2025…"]` | Fallback match on title if IDs change |
| `awardType` | `MODULE` or `EVENT` | Which API filter returns it |
| `imageUrl` | Trailhead CDN URL | Badge artwork |
| `sourceUrl` | event blog post or module page | Provenance |

What's known so far. Rows with an award ID were confirmed live from Ellie's profile on Oct 31, 2026; the rest still need a profile that holds them.

| Year | Award title (exact, from the API) | `awardType` | Award ID | Source |
| --- | --- | --- | --- | --- |
| 2026 | Trick or Trailhead: Tell Us S’more Campfire Stories (curly apostrophe) | `MODULE` | `03188f1d-5165-69ca-68b7-b70a2900301a` | [module page](https://trailhead.salesforce.com/content/learn/modules/trick-or-trailhead-tell-us-smore-campfire-stories) |
| 2025 | Trick or Trailhead 2025: A Ghost at Sillicorn Valley Inn | `MODULE` | `02fe2109-00fd-8f0f-a396-ee9150133b59` | [module page](https://trailhead.salesforce.com/content/learn/modules/trick-or-trailhead-2025-a-ghost-at-sillicorn-valley-inn) |
| 2024 | Trick or Trailhead: Escape from Flow Manor (10th annual) | `MODULE` | `02e189ac-5cfc-b2ef-e304-c565bc2d50b8` | [Salesforce blog](https://www.salesforce.com/blog/trick-or-trailhead/) |
| 2023 | Unknown, probably IX | ? | ? | not found; not on Ellie's profile |
| 2022 | Trick or Trailhead VIII | `EVENT` | `02a890f5-4d00-0369-eb92-9339b0b9a1b8` | [Salesforce blog](https://www.salesforce.com/blog/trick-or-trailhead-viii/) |
| 2021 | Trick or Trailhead VII | `EVENT` | `028be35b-30c6-447c-0d1c-7d064a89108a` | [Salesforce blog](https://www.salesforce.com/blog/trick-or-trailhead-vii/) |
| 2020 | Trick or Trailhead VI (the API title has a leading space) | `EVENT` | `026ecba4-04a5-19ba-7343-ce257bd336b9` | [Trailhead blog](https://medium.com/trailhead/time-for-a-candy-coated-trick-or-trailhead-vi-7ca261fc0503) |
| 2019 | Trick or Trailhead V | `EVENT` | `0252d7ea-8d50-7038-0dd3-050893aad361` | [Trailhead blog](https://medium.com/trailhead/trick-or-trailhead-v-tales-from-the-80s-8d37256772fd) |
| 2018 | Trick or Trailhead IV | probably `EVENT` | ? | [Trailhead blog](https://medium.com/trailhead/the-fur-midable-tail-of-trick-or-trailhead-iv-7f36fa618fa3) |
| 2017 | Trick or Trailhead III | probably `EVENT` | ? | [Trailhead blog](https://medium.com/trailhead/beware-of-trick-or-trailhead-iii-5d950fdf9b14) |
| 2015–2016 | Probably I and II, unconfirmed | ? | ? | not found |

Image URLs are on several hosts (`res.cloudinary.com`, `dfc-static-production.s3.amazonaws.com`, `developer.salesforce.com`), which matters for the hot-link vs mirror decision. Title matching must trim whitespace and normalise apostrophes.

Bootstrapping: Ellie's profile covers 2019–2022 and 2024–2026. In the Phase 0 spike, record it as fixtures, then fill 2015–2018 and 2023 from an alternative profile Ellie will suggest at the time.

## Proposed architecture

The tool follows the repo's existing proxy-route pattern (`/api/podcasts`, Spurs Women news): a thin route handler, logic in `src/lib/`, cached with `createCachedFunction`, rate-limited with `rateLimitResponse`.

&#91;embedded content: request path for one lookup · 5 parts\]

The browser only ever talks to our own route. The badge service merges what Trailhead says the user earned with the catalogue of everything that exists.

| Piece | Proposed location | Notes |
| --- | --- | --- |
| Production gate | `src/lib/trailhead/availability.ts` | `isTrickOrTrailheadEnabled()`, same pattern as `src/lib/microbrew/availability.ts`: on in local dev and Vercel previews, off in production unless `TRICK_OR_TRAILHEAD_ENABLED=true`. When off, the page and API route 404 (the route before any Trailhead call) and links to the page aren't rendered |
| Page | `src/app/salesforce/trick-or-trailhead/page.tsx` + client lookup component | Server component shell; client component for the form and results |
| API route | `src/app/api/trick-or-trailhead/route.ts` | `GET ?username=`; returns `{ profile, earned[], missing[], unmatched[], total }`. Sets `maxDuration = 30` (a full scan measured 11.5s from Vercel) |
| Trailhead client | `src/lib/trailhead/client.ts` | GraphQL query, pagination (page size 50, cap 40 per type, early exit), per-request timeout, null-award detection, typed errors |
| Response schema | `src/lib/trailhead/schema.ts` | Validates upstream shape (hand-written type guards, or zod if already a dependency) |
| Matcher | `src/lib/trailhead/match.ts` | Pure function: catalogue + earned awards → result |
| Catalogue | `src/data/trick-or-trailhead-badges.json` | Hand-curated; validated by a Jest test |
| Styles | `src/styles/trick-or-trailhead.css` | Imported via `globals.css` with `layer(base)`, like other page CSS |
| Docs | `reference/trick-or-trailhead/README.md` | How it works, adding a badge, what to do when Trailhead changes |

This is a core-site project, not Spurs Women, so it doesn't belong in `src/lib/data/` (which is the Spurs Women data layer); `src/lib/trailhead/` keeps it self-contained. No browser CSP change is needed: the browser never calls Trailhead, and the existing `img-src 'self' data: blob: https:` in `next.config.ts` already allows hot-linked badge artwork and avatars.

## Page design outline

One page at `/salesforce/trick-or-trailhead`, linked from the new `/salesforce` landing page and the Salesforce card on `/projects`, with five states.

1. **Empty (no username):** page header, a one-line explanation, username input + "Check badges" button, then the full catalogue as a gallery (all badges in colour, labelled by year).
2. **Loading:** button disabled with a spinner; the grid stays visible with skeleton overlays. A first lookup can take 10–20s, so the loading state says so ("Checking every badge on this profile, this can take up to 20 seconds the first time") rather than looking stuck.
3. **Result:** profile name/avatar, headline score ("7 of 12"), a progress bar, then the grid with earned badges in colour and missing ones greyed and labelled. Optional filter: All / Earned / Missing.
4. **Error:** inline message above the grid for private profile, not found, rate limited, or upstream changed. The catalogue stays visible.
5. **Footer note:** "Unofficial fan-made tool, not affiliated with Salesforce. Uses public Trailhead profile data." plus a short inline "How it works" disclosure (there's no separate write-up; see Non-goals).

Theme: Halloween-flavoured but restrained, using the site's existing variables and dark mode rather than a separate theme file like Spurs Women's. Badge cards: artwork, year, title, status label.

## Testing strategy

The matching logic and API client get Jest coverage with recorded fixtures; the page gets Playwright with the route mocked. Nothing in CI calls the real Trailhead API.

| Layer | Tool | What's covered |
| --- | --- | --- |
| Username parsing | Jest | Bare usernames, both profile URL formats, whitespace, invalid input |
| Trailhead client | Jest | Pagination across pages, page cap, early exit once all catalogue badges are found, timeout, private/not-found responses, both rate-limit shapes (429 and 200 + `TOO_MANY_REQUESTS`), `award: null` → typed error, schema mismatch → typed error. Uses recorded fixture JSON from the Phase 0 spike. |
| Catalogue matching | Jest | Match by ID, fallback match by title, unknown event badges surfaced (FR-8), no duplicate counting |
| Catalogue file | Jest | Every entry valid: unique years/IDs, required fields, image URL format |
| Components | Jest + RTL | Badge card earned/missing states, score summary, error messages, aria-live announcement |
| Page | Playwright | Empty → lookup → result; shareable `?u=` URL; each error state; with `page.route` mocking `/api/trick-or-trailhead` |
| Live check | Manual (optional scheduled script later) | Real lookup against a known public profile, to catch upstream changes |

API routes aren't covered by Jest in this repo (see `reference/testing/README.md`), so the route handler stays thin and the logic lives in testable `src/lib/` modules.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Trailhead changes or locks down the GraphQL API | Medium | High: lookups stop working | Schema validation + clear "Trailhead changed" state; catalogue gallery still works; client isolated in one module so a fix is one file |
| Endpoint blocks server-side calls (bot protection, needs headers or tokens) | Unknown | High | Phase 0 spike proves it from Vercel before any UI is built; go/no-go there |
| Page cap misses module badges on large profiles: 2024–2026 are `MODULE` awards, and a lookup has to page through modules to find them | Medium | High: wrong score for active Trailblazers | Page size 50 with a 40-page cap per type (2,000 awards); stop early once all are found. Spike checks whether a direct per-module query exists. If a profile hits the cap, show the score as incomplete rather than wrong |
| Large pages silently drop awards (`award: null`, no error) | Confirmed above a page size of ~50 | High: earned badges shown as missing | Page size 50; treat any null award as a failure, never skip it; a Jest test covers it |
| Cold lookups use up Trailhead's shared per-IP budget (~200 requests/min across all visitors, ~16 per cold lookup) | Medium around Halloween | Medium: lookups fail with "too many requests" | 24h cache; early exit; no retry loops; our per-IP rate limit; if it becomes a problem, add a shared Redis cache and limiter like Trailhead-Banner's |
| Cold lookups take 10–20s | Confirmed | Medium: feels broken, or hits the function time limit | Loading state that explains the wait; `maxDuration` set on the route; 24h cache so repeat visits are instant |
| Catalogue incomplete or wrong (2015–2018 and 2023 not yet confirmed) | High | Medium: wrong score | FR-8 surfaces unmatched event badges; label the catalogue "as complete as we know"; invite corrections |
| Old event badges retired from profiles or renamed | Medium | Medium | Match on IDs and titles; test against a profile that holds old badges |
| Terms of use: the Salesforce Program Agreement (updated Oct 14, 2026) prohibits "any robot, spider… or other manual or automatic device to retrieve… or otherwise gather any information… available in or through the Program… without Salesforce's express prior written consent" | Confirmed | High: account or reputational risk | Built but gated off production until permission or an accepted-risk decision ([WEB-234](https://eleanormatthewman.atlassian.net/browse/WEB-234)). If refused, fall back to the catalogue gallery or a manual checklist with no Trailhead calls |
| Branding concerns | Low–Medium | Medium | Public data only; caching keeps load low; clear unofficial disclaimer; no Trailhead logo as page branding |
| Abuse or heavy traffic around Halloween | Low | Low | Rate limiting + 24h cache; page cap per lookup |
| Badge images hot-linked from Trailhead CDN break | Medium | Low | Fallback placeholder image; optionally mirror artwork into `public/` if licence allows |

## Salesforce section move

The existing Salesforce pages move under `/salesforce` as a separate refactor, done before the checker so the checker PR stays focused. Old URLs get permanent (308) redirects in `next.config.ts` so external links, search results and shared posts keep working.

| Current URL | New URL | Files to move |
| --- | --- | --- |
| `/salesforce-orgs` | `/salesforce/free-and-trial-orgs` | `src/app/salesforce-orgs/` |
| `/lightning-rollout` (+ `/part-1`–`/part-3`) | `/salesforce/lightning-rollout` (+ parts), already descriptive | `src/app/lightning-rollout/`, `public/lightning-rollout/` |
| `/ghl` | `/salesforce/fantasy-football-draft` | `src/app/ghl/`, `public/ghl/` |
| (new) | `/salesforce` | Landing page listing the Salesforce projects |
| (new) | `/salesforce/trick-or-trailhead` | This tool |

Also in scope:

- Update every internal link: `ProjectsContent.tsx`, the Lightning Rollout blog navigation, page metadata (`openGraph.url`, image URLs) and the matching Jest component tests.
- Fix a bug found along the way: `/salesforce-orgs`'s share image points to `/salesforce-orgs/imgs/orgsPreview.png`, which doesn't exist. The file is at `public/img/orgsPreview.png`.
- No Playwright spec references these paths today; add one checking each old URL redirects to its new one.
- Update `reference/CSS_ARCHITECTURE.md`, which mentions the old paths.
- The Quick Tips and community blog posts on the projects page link to external sites, so they stay as they are.

Slugs are renamed to match each page's title, since redirects are being added anyway. Asset folders under `public/` can move to match (`public/salesforce/…`), or stay where they are; decide in the refactor PR.

## Delivery plan

Five steps, each its own PR. The section move and the Phase 0 spike don't depend on each other and can run in parallel; the checker build only starts once a real lookup works from Vercel.

1. **Salesforce section move (refactor).** Move the three existing Salesforce pages under `/salesforce`, add redirects and the landing page, fix the orgs share image (see above).
2. **Phase 0, spike (go/no-go).** A throwaway script plus a temporary route proving `GetTrailheadBadges` works server-side from Vercel with `EVENT` and `MODULE` filters at a page size of 50, timing a full cold lookup there. Look for a direct per-module completion query. Confirm the error and rate-limit shapes. Record fixture JSON from `elliematthewman`. Read the Trailhead terms of use. Fill the catalogue's 2015–2018 and 2023 gaps.
3. **Phase 1, data layer.** Username parser, Trailhead client (pagination, timeout, schema validation, typed errors), catalogue JSON + matcher, cached wrapper, thin API route with rate limiting. Jest tests with fixtures.
4. **Phase 2, page.** `/salesforce/trick-or-trailhead` with all five states, page CSS, links from `/salesforce` and `/projects`. Decide badge artwork (hot-link vs mirror) here. RTL + Playwright tests.
5. **Phase 3, polish and docs.** Accessibility pass, metadata/OG image for shared links, `reference/trick-or-trailhead/README.md` (architecture + "adding next year's badge"), `reference/README.md` index entry.
6. **Launch (blocked).** Once Ellie has Salesforce's written permission or decides to accept the risk, set `TRICK_OR_TRAILHEAD_ENABLED=true` in Vercel production and redeploy. Until then everything above ships to `main` but stays hidden in production.

Proposed Jira breakdown (`WEB` project, label `core-site`):

| Issue | Type | Epic | Branch |
| --- | --- | --- | --- |
| [WEB-229](https://eleanormatthewman.atlassian.net/browse/WEB-229) Move Salesforce pages under /salesforce (also fixes [WEB-190](https://eleanormatthewman.atlassian.net/browse/WEB-190)) | Task | Component Consistency & Standardization (WEB-38) | `refactor/WEB-229-salesforce-section` |
| [WEB-228](https://eleanormatthewman.atlassian.net/browse/WEB-228) Trick or Trailhead Badge Checker | Epic | — | — |
| [WEB-230](https://eleanormatthewman.atlassian.net/browse/WEB-230) Spike: verify Trailhead profile GraphQL from Vercel + bootstrap catalogue | Task | WEB-228 | `chore/WEB-230-trailhead-api-spike` |
| [WEB-231](https://eleanormatthewman.atlassian.net/browse/WEB-231) Trailhead client, catalogue and API route | Story | WEB-228 | `feature/WEB-231-trailhead-badge-api` |
| [WEB-232](https://eleanormatthewman.atlassian.net/browse/WEB-232) Trick or Trailhead checker page | Story | WEB-228 | `feature/WEB-232-trick-or-trailhead-page` |
| [WEB-233](https://eleanormatthewman.atlassian.net/browse/WEB-233) Docs, accessibility and share metadata | Task | WEB-228 | `docs/WEB-233-trick-or-trailhead-docs` |
| [WEB-234](https://eleanormatthewman.atlassian.net/browse/WEB-234) Launch (needs Salesforce permission or an accepted-risk decision); status Blocked | Task | WEB-228 | none (a Vercel env var change) |

Dependencies (Jira "blocks" links): WEB-230 → WEB-231 → WEB-232 → WEB-233 → WEB-234, and WEB-229 → WEB-232. Each PR runs `/code-review` before it's raised, per CLAUDE.md.

## Decisions

| Question | Decision |
| --- | --- |
| Scope | Trick or Trailhead badges only for now |
| URL | `/salesforce/trick-or-trailhead`, with existing Salesforce pages moved under `/salesforce` first |
| 2026 badge | Include it: Tell Us S'more: Campfire Stories, running now |
| Catalogue bootstrap | Ellie's profile (`elliematthewman`); Ellie suggests alternatives for any gaps at the time |
| Badge artwork | Decide during the Phase 2 build |
| Profile avatar and name | Show them |
| Cache TTL and rate limit | 24 hours (changed from 1 hour after the live findings) and 10 lookups per IP per minute; revisit after launch |
| Lookup speed | Cold lookups of 10–20s accepted, with a loading state that explains the wait (replaces the earlier 3s target). Measured from Vercel: 11.5s for a full scan, ~2–3s when stopping early. Route `maxDuration` is 30s |
| Page size and cap | 50 per page, 40 pages per award type, stop early once all badges are found |
| Terms of use (go/no-go) | Oct 31, 2026: keep building, but don't launch until Salesforce gives written permission or Ellie decides to accept the risk. Gated off production meanwhile ([WEB-234](https://eleanormatthewman.atlassian.net/browse/WEB-234)) |
| Trailhead-Banner code | Reuse its error handling and username parsing where it fits, credited under BSD-3-Clause |
| How-it-was-built write-up | No |
| Scheduled live check | Not for now |

Moved pages are renamed: `/salesforce/free-and-trial-orgs`, `/salesforce/lightning-rollout`, `/salesforce/fantasy-football-draft`.

Still open:

- [ ] Exact titles, IDs and award types for 2015–2018 and 2023: need a profile that holds them (Phase 0 spike).
- [ ] What does a private profile return? Needs a known private username.
- [ ] Permission from Salesforce, or a decision to accept the risk ([WEB-234](https://eleanormatthewman.atlassian.net/browse/WEB-234)).
