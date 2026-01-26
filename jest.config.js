const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // FIXED: Maps @ to root, not src/
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx)',
    '**/?(*.)+(spec|test).(ts|tsx)',
  ],
  
  collectCoverageFrom: [
    '{components,contexts,hooks,lib,utils}/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/__tests__/**',
  ],
}

module.exports = createJestConfig(customJestConfig)