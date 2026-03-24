module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'scripts/**/*.js',
    '!scripts/main.js',
    '!**/node_modules/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};
