# Testing Guide

This project uses Jest and React Testing Library for unit/component tests, StrykerJS for mutation testing, and Playwright for E2E (see `tests/`).

## 🚨 **MANDATORY TESTING REQUIREMENTS**

**All new components and utilities MUST include tests before deployment:**

1. **Unit Tests** - For utility functions and pure logic
2. **Component Tests** - For React components using React Testing Library
3. **Edge Case Testing** - Error states, missing props, invalid inputs
4. **Accessibility Testing** - ARIA labels, semantic structure
5. **TypeScript Coverage** - Proper typing for all new code

**Quality Gates:**
- Tests must pass: `npm run test` ✅
- Build must succeed: `npm run build` ✅
- Coverage should not decrease: `npm run test:coverage`
- No blocking lint errors: `npm run lint`

## Available Scripts

- `npm run test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report (enforces `coverageThreshold` in `jest.config.js`)
- `npm run test:mutation` - Run StrykerJS mutation testing (see below; manual/local only, not wired into CI)

## Test Structure

Tests are organized in `__tests__` directories alongside the code they test:

```
src/
├── app/
│   └── __tests__/
│       └── page.test.tsx
├── components/
│   └── __tests__/
│       └── Button.test.tsx
└── lib/
    └── utils/
        └── __tests__/
            └── date.test.ts
```

Shared test infrastructure (test doubles, not test cases) lives outside any `__tests__` dir, e.g. `src/test-utils/supabase-query-mock.ts` - a chainable mock for Supabase's `.from(...).select(...).eq(...)` query builder, used across `src/lib/data/__tests__/*`.

## Why coverage numbers cover the whole app, not just tested files

`jest.config.js` sets `collectCoverageFrom: ['src/**/*.{ts,tsx}', ...]` explicitly. Without it, Jest's coverage report only includes files some test actually `import`s - a page or component with zero tests simply doesn't appear in the report at all, so "80% coverage" can quietly mean "80% of the 25% of the app anyone bothered to test." With `collectCoverageFrom` set, every source file shows up (as 0% if untested), so `npm run test:coverage`'s numbers reflect the real state of the whole app. `collectCoverageFrom` excludes `src/app/api/**` (API routes - see below) and `src/middleware.ts` (thin delegate to `src/lib/supabase/middleware.ts#updateSession`, which is unit tested directly).

## Mutation testing (StrykerJS)

Coverage percentage only proves a line *ran* during some test - not that the test would notice if the line's logic were wrong. A test like `expect(typeof getStadiumBySlug).toBe('function')` or `await expect(someCall()).resolves.not.toThrow()` executes the function and counts as "covered," but passes no matter what the function actually returns. Mutation testing catches this: Stryker makes a small deliberate change to the source (flip `>` to `>=`, delete a `- 1`, swap `&&`/`||`, change a returned value) and reruns the tests - if every test still passes, that mutant "survived," meaning nothing in the suite would actually catch that bug.

**Run it:** `npm run test:mutation` (wraps `stryker run`, config in `stryker.conf.mjs`). Not wired into CI - StrykerJS re-runs the relevant tests once per mutant, which is too slow for a solo-maintained project's CI budget. Run it locally after writing tests for a logic-heavy file, or periodically to spot-check the suite.

**Scope:** deliberately limited to `src/lib/data/**`, `src/lib/*.ts`, `src/lib/supabase/middleware.ts`, and `src/hooks/**` (see `mutate` in `stryker.conf.mjs`) - not the whole `src/` tree. Mutating presentational JSX components produces mostly low-signal or equivalent mutants (e.g. flipping a CSS class string) and would make runs impractically slow for little benefit. Add a glob to `stryker.conf.mjs` when a new file's logic is worth mutation-testing.

**What counts as a real gap vs. an equivalent mutant:** not every surviving mutant is a missing test. Some source expressions have two forms that are provably identical for every input (e.g. `value !== null && value !== undefined ? value : null` vs. `value !== undefined ? value : null` - both return `null` whether `value` is `null` or `undefined`). Stryker will report these as "survived" because it can't prove equivalence, but no test can kill them either, since the mutant produces byte-identical output. Recognize the difference before writing a test to chase a survivor - if you can't construct *any* input where the original and mutated code would return different values, it's equivalent, not a gap.

**Writing tests that would survive this bar:**
- Assert exact return values (`expect(payload.spurs_score).toBe(0)`), not just "resolves" / "is a function" / "doesn't throw."
- Cover every branch: success and error paths, empty/null/undefined inputs, boundary values (0, negative, exactly-at-limit).
- For anything with an off-by-one risk (loop bounds, `.slice()`/`.limit()` counts, date comparisons), assert the exact boundary, not just a value comfortably inside it.
- See `src/lib/__tests__/admin-match-payload.test.ts`, `src/lib/supabase/__tests__/middleware.test.ts`, and `src/hooks/__tests__/useRegicideGame.test.ts` as reference examples - all mutation-tested during the 2026-08 hardening pass (see below) and currently killing all non-equivalent mutants in their files.

## Priority: logic first, presentation lighter

Business-logic-heavy code (the Supabase data-access layer in `src/lib/data/`, hooks with real state machines like `useRegicideGame`, security-relevant code like the admin-route auth guard in `src/lib/supabase/middleware.ts`, parsing/formatting utilities) gets deep, mutation-tested unit tests. Purely presentational components and pages (static content pages, icon wrappers, layout shells) are lower-value mutation-testing targets - a wrong CSS class rarely has a "correct" assertion worth defending at the unit level - and are covered more cheaply via the Playwright E2E suite plus lighter render/smoke tests where warranted. As of 2026-08 this split is: the logic layer (`src/lib`, `src/lib/data`, `src/hooks`) sits at 90-100% coverage with mutation-tested assertions; most presentational components/pages are still untested at the unit level and are the target of a planned follow-up pass (see `git log` / recent PRs for current status - this file describes the target methodology, not a point-in-time task list).

## API Route Testing

API routes (`src/app/api/**`) are **not** covered by Jest - Next.js App Router's server-side Request/Response handling is impractical to mock reliably under Jest. They're excluded from `collectCoverageFrom` for this reason and exercised instead by the Playwright E2E suite (`tests/`) and manual testing.

## Writing Tests

### Component Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
  })
})
```

### Utility Function Testing

```ts
import { formatDateConsistent } from '../date'

describe('Date Utilities', () => {
  it('formats date consistently', () => {
    const result = formatDateConsistent('2024-03-15T10:30:00Z')
    expect(result).toBe('15/03/2024')
  })
})
```

### Mocking

For external dependencies, use Jest mocks:

```tsx
// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }) {
    return <a href={href}>{children}</a>
  }
})

// Mock external modules
jest.mock('@/lib/fullstory', () => ({
  trackEvent: jest.fn(),
  trackPageView: jest.fn()
}))
```

For the Supabase query-builder chain used throughout `src/lib/data/*`, use the shared test double instead of hand-rolling one:

```ts
import { mockSupabaseFrom } from '@/test-utils/supabase-query-mock';

const mockFrom = mockSupabaseFrom({
  stadia: { data: { id: '1', name: 'Brisbane Road' }, error: null },
});
jest.mock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));
```

Note: `createCachedFunction` (in `src/lib/data/cache-utils.ts`) checks `typeof window === 'undefined'` to decide whether to go through `unstable_cache`. Under Jest's `jest-environment-jsdom`, `window` is always defined, so every cached `get*` function takes the "bypass" branch and calls the underlying fetcher directly - no need to mock `next/cache` to test these functions.

## Best Practices

1. **Test behavior, not implementation** - Focus on what the user sees and interacts with
2. **Use semantic queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Mock external dependencies** - Isolate your tests from APIs, routing, etc.
4. **Test edge cases** - Invalid inputs, loading states, error conditions
5. **Keep tests simple** - Each test should verify one specific behavior
6. **Assert real outcomes** - see the Mutation Testing section above; a test that can't fail isn't testing anything

## Coverage

Run `npm run test:coverage` for the current numbers - `coverageThreshold` in `jest.config.js` documents the last-measured baseline inline and is kept a few points below it so a real regression fails the check without being fragile to normal fluctuation.

**Why the threshold numbers dropped in 2026-08, and why that's not a regression:** before then, `jest.config.js` had no `collectCoverageFrom`, so coverage was only measured over the ~25% of the codebase some test happened to `import` - the other ~150 files (mostly pages/components) were invisible to the report rather than counted as 0%, which is how the old thresholds reached 75/60/70/75. Adding `collectCoverageFrom` made the same test suite's *honest* whole-app number ~31%. Thresholds were reset to a few points below that honest baseline and have been rising since as real tests were added (31% → 54.5% → 58.5% → 61.7% → 62.8% statements, tracking the `lib`/`lib/data`/`hooks` and then `hooks/admin` mutation-testing passes). The numeric threshold is lower than it used to be; actual coverage is unchanged or higher. As of this writing, `npm run test:coverage` reports 90 test suites / 973 tests passing, at 62.84% statements / 56.35% branches / 56.64% functions / 62.99% lines - `coverageThreshold` in `jest.config.js` (54/48/48/54) sits a few points below that, per the policy above.

**Goal: 80% statements/branches/functions/lines, whole-app.** Raise `coverageThreshold` in `jest.config.js` incrementally as real tests land - never lower it to unblock a failing PR. Priority order for closing the remaining gap (see the "Priority: logic first" section above): remaining `src/lib/data` files with sub-80% mutation scores, then a render/smoke-test pass over presentational components/pages, which currently sit at or near 0%.

E2E coverage (Playwright, `tests/`) is separate and not reflected in the Jest coverage report - run via `npx playwright test`, also in CI via `.github/workflows/playwright.yml`.
