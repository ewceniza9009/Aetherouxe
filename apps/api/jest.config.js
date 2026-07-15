/** Jest config for the API (unit + light integration tests). */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          // Tests don't need the app's strict rootDir/emit constraints.
          noImplicitAny: false,
          strictNullChecks: false,
        },
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
