# Trailhead API fixtures

Real responses from `POST https://profile.api.trailhead.com/graphql`, recorded
on Oct 31, 2026 for the WEB-230 spike, for WEB-231's Jest tests. Nothing in CI
calls the live API. Every file is the full JSON body for one request using
[`query.graphql`](./query.graphql), with variables
`{ slug, count, after, filter }`.

| File | Variables | What it shows |
| --- | --- | --- |
| `event-page-1.json`, `-2`, `-3` | `elliematthewman`, `count: 50`, `EVENT`, each page's `after` cursor | A full multi-page sequence (123 awards). Trick or Trailhead V-VIII are in here. The 2020 title has a leading space (`" Trick or Trailhead VI"`) |
| `module-page-1.json`, `-2` | `elliematthewman`, `count: 50`, `MODULE` | The first two of 13 module pages. They hold all three Trick or Trailhead modules (2024-2026), since awards come newest first. Page 2's `hasNextPage` is `true`, so it suits early-exit tests. The 2026 title uses a curly apostrophe |
| `event-page-1-size-100-award-null.json` | `elliematthewman`, `count: 100`, `EVENT` | The page-size bug: 50 of 100 nodes come back `award: null`, with no error |
| `not-found.json` | unknown username, `count: 50`, `EVENT` | HTTP 200, `data: null`, `errors[0].extensions.code === "NOT_FOUND"` |

Not recorded: a private profile (`profile.__typename === "PrivateProfile"`;
needs a known private username) and a rate-limited response (HTTP 429 with no
`Retry-After`, or HTTP 200 with `extensions.code === "TOO_MANY_REQUESTS"`).
Build those by hand in tests. The shapes are from nabondance/Trailhead-Banner's
handling of the same API.

All the data is from Ellie's own public profile.
