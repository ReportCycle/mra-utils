export default {
    rootDir: '../../',
    testTimeout: 100000,
    globalSetup: '<rootDir>/src/config/jest.globalSetup.mjs',
    globalTeardown: '<rootDir>/src/config/jest.globalTeardown.mjs',
    setupFilesAfterEnv: ['<rootDir>/src/config/jest.setup.mjs'],
    testMatch: ['**/tests/**/*.mjs'],
    transform: {
        '^.+\\.mjs$': ['babel-jest', { configFile: './src/config/babel.config.cjs', babelrc: false }],
    },
    testEnvironment: 'node',
    transformIgnorePatterns: [
        '/node_modules/',
    ],
};
