/* eslint-disable no-undef */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  forceExit: false,
  testMatch: ['**/test/*.test.ts', '**/test/**/*.test.ts'],
  testTimeout: 800000,
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@artifacts/(.*)$': '<rootDir>/artifacts/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.json',
      },
    ],
  },
};
