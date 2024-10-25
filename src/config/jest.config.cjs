// jest.config.cjs for testing build

module.exports = {
  rootDir: '../../',
  testTimeout: 100000,
  globalSetup: '<rootDir>/lib/config/jest.globalSetup.js', // Update path if needed after transpilation
  globalTeardown: '<rootDir>/lib/config/jest.globalTeardown.js', // Update path if needed after transpilation
  setupFilesAfterEnv: ['<rootDir>/lib/config/jest.setup.js'], // Update path if needed after transpilation
  testMatch: ['**/tests/**/*.js'], // Update if needed to match transpiled file extensions
  testEnvironment: 'node'
};
