module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  // The emulator round trip is slower than jest's 5s default, and the first
  // test in a file pays for `initializeTestEnvironment` uploading the rules.
  testTimeout: 30000,
}
