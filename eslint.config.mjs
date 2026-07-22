import nx from '@nx/eslint-plugin';
import jsoncEslintParser from 'jsonc-eslint-parser';

export default [
  ...nx.configs['flat/base'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // Newly enabled by the ESLint v9 / typescript-eslint v8 recommended presets;
      // these were not enforced before the flat-config migration.
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      'prefer-const': 'off',
    },
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          // typescript is a host-provided tool and tslib is supplied by the
          // Nx runtime; neither needs to be declared in package.json.
          ignoredDependencies: ['typescript', 'tslib'],
        },
      ],
    },
    languageOptions: {
      parser: jsoncEslintParser,
    },
  },
  {
    // Generator template package.json files are app scaffolding, not this
    // project's manifest; skip dependency checks for them.
    files: ['**/src/generators/**/files_*/**/package.json'],
    rules: {
      '@nx/dependency-checks': 'off',
    },
  },
];
