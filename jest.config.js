import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  // Jest's default testMatch picks up *.spec.ts anywhere, which would otherwise
  // include the Playwright specs in <rootDir>/tests/. .stryker-tmp is Stryker's
  // sandboxed full-repo copy used while `npm run test:mutation` is running -
  // without excluding it, a concurrent/interrupted Stryker run doubles every
  // test (and skews coverage) by picking up its copy of src/ too.
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/tests/', '<rootDir>/.stryker-tmp/'],
  // Without this, Jest's coverage report only includes files that some test
  // actually `import`s - a page or component with zero tests simply doesn't
  // appear in the report, so "80% coverage" can quietly mean "80% of the 25%
  // of the app we bothered to test". This forces every source file to show up
  // (as 0% if untested), so the numbers reflect the whole app.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/test-utils/**',
    // API routes: Next.js App Router request/response mocking is impractical
    // under Jest - exercised by the Playwright suite instead (see
    // reference/testing/README.md).
    '!src/app/api/**',
    // Thin 4-line delegate to lib/supabase/middleware.ts#updateSession, which
    // holds the actual routing/auth logic and is unit tested directly.
    '!src/middleware.ts',
  ],
  // NOTE ON THE 2026-08 DROP: these numbers used to be 75/60/70/75. That was
  // NOT a higher-quality baseline - collectCoverageFrom (above) didn't exist
  // yet, so coverage was only measured over the ~25% of the codebase some
  // test happened to `import`; ~150 files (mostly pages/components) were
  // invisible to the report rather than counted as 0%. Adding
  // collectCoverageFrom made the same test suite's honest whole-app number
  // ~31%. These thresholds were then deliberately set a few points below
  // that honest baseline, so the numbers below are lower than they used to
  // be while actual test coverage is unchanged or higher - see
  // reference/testing/README.md for the full before/after.
  //
  // Current true baseline as of this writing: ~58.5% statements/lines,
  // ~53.6% branches, ~53% functions (whole app). The logic layer (src/lib,
  // src/lib/data, src/hooks including src/hooks/admin) is at 85-100% with
  // mutation-tested assertions; most of the remaining gap is presentational
  // components/pages, deliberately deferred to a lighter render/smoke-test
  // follow-up pass rather than deep unit tests (see reference/testing/README.md).
  //
  // GOAL: raise all four numbers over time, target 80% each, as more of the
  // codebase gets meaningful tests. Only enforced by `npm run test:coverage`,
  // not by plain `npm test`. Raise these as coverage genuinely improves -
  // never lower them just to make a failing PR pass.
  coverageThreshold: {
    global: {
      statements: 54,
      branches: 48,
      functions: 48,
      lines: 54,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig)
