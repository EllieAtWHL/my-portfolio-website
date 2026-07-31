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
  // include the Playwright specs in <rootDir>/tests/.
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/tests/'],
  // Floor set a few points below the current baseline (~81% statements/lines,
  // ~69% branches, ~79% functions as of this writing) so it catches a real
  // regression without being fragile to normal fluctuation. Only enforced by
  // `npm run test:coverage`, not by plain `npm test`. Raise these over time as
  // coverage improves - don't lower them to make a failing PR pass.
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 60,
      functions: 70,
      lines: 75,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig)
