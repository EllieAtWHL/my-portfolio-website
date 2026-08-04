// @ts-check
/**
 * Mutation testing config (see reference/testing/README.md).
 *
 * Deliberately scoped to logic-heavy, non-JSX files rather than the whole
 * `src/` tree: mutating presentational components produces mostly
 * low-signal/equivalent mutants (e.g. flipping a CSS class string) and makes
 * runs impractically slow for a solo-maintained project. Add a glob here
 * when a new file's logic is worth mutation-testing.
 *
 * Run manually with `npm run test:mutation` - not wired into CI.
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
const config = {
  packageManager: 'npm',
  testRunner: 'jest',
  jest: {
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
  },
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  coverageAnalysis: 'off',
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: {
    fileName: 'reports/mutation/index.html',
  },
  mutate: [
    'src/lib/data/**/*.ts',
    'src/lib/*.ts',
    'src/lib/supabase/middleware.ts',
    'src/hooks/**/*.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts',
    // Thin SDK wrappers with no branching logic of our own - low-value to mutate.
    '!src/lib/supabase/client.ts',
    '!src/lib/supabase/server.ts',
  ],
  ignorePatterns: ['node_modules', '.next', 'reports', 'coverage', 'tests'],
  concurrency: 4,
  timeoutMS: 60000,
};

export default config;
