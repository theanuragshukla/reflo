/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default', // or 'ts-jest/presets/js-with-ts'
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};


