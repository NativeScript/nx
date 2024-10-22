module.exports = {
  preset: '<%= projectRootOffset %>jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        stringifyContentPathRegex: '\\.(html|svg)$',
        astTransformers: ['jest-preset-angular/build/InlineFilesTransformer', 'jest-preset-angular/build/StripStylesTransformer'],
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },

  coverageDirectory: '<%= projectRootOffset %>coverage/<%= projectRoot %>',

  displayName: 'nativescript-safety',
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
