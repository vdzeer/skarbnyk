const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/scripts/**/*.test.ts',
  ],
  // Tests import through the same `~` alias as the app.
  moduleNameMapper: { '^~/(.*)$': '<rootDir>/src/$1' },
  // `rules-tests/` has its own jest run against the emulator.
  modulePathIgnorePatterns: ['<rootDir>/rules-tests/', '<rootDir>/out/'],
}

module.exports = createJestConfig(config)
