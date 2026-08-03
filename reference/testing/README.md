# Testing Guide

This project uses Jest and React Testing Library for testing.

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

## Setup

The following testing dependencies are installed:
- `jest` - Test runner
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - Custom DOM matchers
- `@types/jest` - TypeScript types for Jest

## Available Scripts

- `npm run test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

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

## Testing Standards Checklist

**Before deploying new code, verify:**

### ✅ **Component Tests**
- [ ] Component renders with default props
- [ ] All props and variants work correctly
- [ ] Error states are handled gracefully
- [ ] Loading states work as expected
- [ ] Click interactions are tested
- [ ] Accessibility attributes are present

### ✅ **Utility Tests**  
- [ ] Function works with valid inputs
- [ ] Edge cases are handled (null, undefined, empty)
- [ ] Error conditions are tested
- [ ] Return types are correct
- [ ] Performance is acceptable

### ✅ **Quality Checks**
- [ ] Tests are descriptive and maintainable
- [ ] No console errors in tests
- [ ] Proper assertions are used
- [ ] Tests are isolated (no dependencies on order)
- [ ] Coverage is maintained or improved

### ✅ **Integration Checks**
- [ ] Component works in real page context
- [ ] No TypeScript errors
- [ ] No lint errors (blocking)
- [ ] Build succeeds
- [ ] Manual testing confirms functionality

**Example Test Structure:**
```typescript
describe('ComponentName', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      // Test basic rendering
    });
    
    it('applies variant classes correctly', () => {
      // Test different variants
    });
  });
  
  describe('Interactions', () => {
    it('handles click events', () => {
      // Test user interactions
    });
  });
  
  describe('Edge Cases', () => {
    it('handles missing props gracefully', () => {
      // Test error states
    });
  });
});
```

## Current Test Coverage

**Test Count**: 356 tests across 46 test suites (last verified via `npm run test:coverage`)

- **Button Component** (`src/components/Button.tsx`)
  - Renders with default props
  - Applies variant, size, and width classes correctly
  - Handles loading and disabled states
  - Renders icons in correct positions
  - Handles click events
  - Supports `asChild` prop for custom elements
  - Forwards refs correctly

- **Card Component** (`src/components/Card.tsx`)
  - Renders with default props and all variants
  - Applies correct padding classes (including accent variant special handling)
  - Handles hover effects and click interactions
  - Combines multiple props correctly
  - Renders complex children content

- **Modal Component** (`src/components/Modal.tsx`)
  - Opens/closes based on isOpen prop
  - Renders all content types (image, description, date, additional images/info)
  - Handles click events (close button, overlay, content click prevention)
  - Manages body scroll and keyboard events (Escape key)
  - Uses React Portal for proper rendering

- **Header Component** (`src/components/Header.tsx`)
  - Renders logo and all navigation items
  - Toggles mobile menu on button click and keyboard
  - Closes menu when navigation links are clicked
  - Has proper ARIA labels and semantic structure
  - Applies theme classes correctly

- **Utility Functions** (`src/lib/utils.ts`)
  - Class name merging with cn() function
  - Conditional class handling
  - Tailwind conflict resolution
  - Complex input scenarios (arrays, objects, mixed types)

- **Date Utilities** (`src/lib/utils/date.ts`)
  - Consistent date formatting across server/client
  - Month name formatting
  - Edge cases (leap years, invalid dates)
  - UTC-based formatting to prevent hydration errors

- **Home Page** (`src/app/page.tsx`)
  - Renders main headings with correct animation classes
  - Renders contact button with proper link
  - Tracks page views on mount
  - Proper component structure

## API Testing Status

**Note**: API route testing is currently challenging due to Next.js App Router's server-side nature. The API routes (`/api/cache/revalidate`, `/api/spurs-women-news`, `/api/podcasts`) require special setup for testing that involves:

- Web API polyfills (Request, Response)
- Server environment simulation
- Complex mocking strategies

**Current Approach**: API routes are tested manually through the running application. Future implementation may include:
- Integration testing with actual HTTP requests
- E2E testing with Playwright or Cypress
- Custom test utilities for Next.js API routes

## Current Testing Status

✅ **Working**: Component tests, utility function tests, page tests  
⚠️ **In Progress**: API route tests (need specialized setup)  
📋 **Planned**: Integration tests, E2E tests

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

## Best Practices

1. **Test behavior, not implementation** - Focus on what the user sees and interacts with
2. **Use semantic queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Mock external dependencies** - Isolate your tests from APIs, routing, etc.
4. **Test edge cases** - Invalid inputs, loading states, error conditions
5. **Keep tests simple** - Each test should verify one specific behavior

## Coverage

Current coverage (as of last `npm run test:coverage` run): **75.25% statements, 62.01% branches, 70.86% functions, 75.08% lines**

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

**Breakdown**:
- app: 90% statements, 100% branches, 66.66% functions, 90% lines (page.tsx)
- app/spurs-women/admin: 72.09% statements, 52.4% branches, 53.33% functions, 71.87% lines (page.tsx)
- app/spurs-women/teams/[teamId]: 92% statements, 63.63% branches, 71.42% functions, 92% lines (TeamClient.tsx)
- components: 100% statements, 96.72% branches, 100% functions, 100% lines (Button 100/100/100/100, Card 100/92.3/100/100, Header 100/83.33/100/100, Modal 100/100/100/100)
- components/admin: 77.04% statements, 84.29% branches, 70.83% functions, 76.66% lines (ColorPicker, FormField, FormWrapper, MatchForm, Pagination, PlayerForm, RelatedList, StadiumForm, TabNav, TeamForm)
- components/admin/modals: 55% statements, 71.05% branches, 45.45% functions, 52.63% lines (FormModal is 100%; MediaModal, PlayerHistoryModal, PlayerStatsModal, StadiumNameModal are only partially covered)
- components/admin/tables: 100% statements, 73.68% branches, 100% functions, 100% lines (DataTable, MatchesTable, PlayersTable, StadiumsTable, TeamsTable)
- components/spurs-women: 71.1% statements, 70.48% branches, 56.47% functions, 71.32% lines (LightboxGallery, MatchNavigation, MediaGallery, PlayerRow, PlayerTable, SpursTabButton, TeamLineup, TeamPill - LightboxGallery, MediaGallery and PlayerTable are only partially covered)
- hooks: 100% coverage (useSearchPagination.ts)
- hooks/admin: 74.03% statements, 33.21% branches, 90% functions, 73.9% lines (useMatchesAdmin, usePlayerStatsModal, usePlayersAdmin, useStadiumsAdmin, useTeamsAdmin)
- lib: 96.66% statements, 84.21% branches, 100% functions, 100% lines
  - admin-api.ts: 90% statements, 100% branches, 100% functions, 100% lines
  - admin-match-payload.ts: 100% statements, 75% branches, 100% functions, 100% lines
  - admin-stadium-names.ts: 95.65% statements, 86.36% branches, 100% functions, 100% lines
  - api-client.ts: 100% statements, 88.88% branches, 100% functions, 100% lines
  - utils.ts: 100% coverage
- lib/data: 58.73% statements, 46.91% branches, 57.69% functions, 56.77% lines
  - cache-utils.ts: 92.3% statements, 87.5% branches, 100% functions, 91.66% lines
  - generic-fetchers.ts: 3.03% statements, 0% branches, 0% functions, 3.03% lines (still effectively untested)
  - stadiums.ts: 68.51% statements, 66.66% branches, 44.44% functions, 67.34% lines
- lib/utils: 100% coverage (date.ts, team-colors.ts)
- utils: 90.9% statements, 54.54% branches, 100% functions, 88.88% lines (supabase.ts)
- API routes: Not currently tested (see API Testing Status above)
- E2E: Not covered by this Jest/coverage report - see the Playwright suite under `tests/` (12 spec files, run via `npx playwright test` and in CI via `.github/workflows/playwright.yml`)

**Build Status**: ✅ Production ready - builds successfully
**Lint Status**: ✅ Only minor optimization warnings (no blocking errors)

**Note**: Overall coverage (75.25%/62.01%/70.86%/75.08%) has drifted since an earlier-recorded 76.49%/60.09%/74.63%/76.26% snapshot, mainly because `components/spurs-women` grew to include several lower-coverage components (`LightboxGallery.tsx`, `MediaGallery.tsx`, `PlayerRow.tsx`, `PlayerTable.tsx`) alongside a new `app/spurs-women/teams/[teamId]/TeamClient.tsx` - pulling down the overall averages even though total test count grew (322 → 356 tests, 40 → 46 suites).

## Recent Testing Progress

**Successfully Added:**
- **Utility Function Tests** - 15 tests for the `cn()` function covering class merging, conditional logic, and Tailwind conflict resolution
- **Comprehensive Component Coverage** - Button, Card, Modal, Header components fully tested
- **Edge Case Handling** - Tests for invalid inputs, missing props, error conditions
- **Accessibility Testing** - ARIA labels, semantic structure, keyboard interactions

**Component Refactoring Completed:**
- **Video Component Consolidation** - Eliminated duplication by using `VideoCard` on both main Spurs Women page and match pages
- **Removed Redundant Components** - Deleted `VideoGallery` and unified video display logic
- **YouTube API Integration** - Added proper metadata fetching using YouTube oEmbed API
- **YouTube Publish Dates** - Now uses actual YouTube upload dates instead of database dates
- **Consistent UI** - Videos now look identical across all Spurs Women pages with proper titles, channels, and dates

**Spurs Women Components Status:**
- **VideoCard** - Now used consistently across all pages (main page + match pages)
- **NewsCard, PodcastCard** - Still need refactoring for better testability
- **Complex Components** - May need structural improvements for automated testing
