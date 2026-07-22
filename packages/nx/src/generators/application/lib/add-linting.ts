import { joinPathFragments, Tree, ensurePackage, runTasksInSerial, NX_VERSION, updateJson } from '@nx/devkit';
import { NormalizedSchema } from '../schema';

export async function addLinting(host: Tree, options: NormalizedSchema) {
  if (options.linter !== 'eslint') {
    return () => {
      /* empty */
    };
  }

  const { lintProjectGenerator } = ensurePackage<typeof import('@nx/eslint')>('@nx/eslint', NX_VERSION);
  // safe to require directly: ensurePackage guarantees @nx/eslint is installed past this point
  const { useFlatConfig, findEslintFile } = require('@nx/eslint/internal') as typeof import('@nx/eslint/internal');

  const lintTask = await lintProjectGenerator(host, {
    linter: options.linter,
    project: options.name,
    tsConfigPaths: [joinPathFragments(options.projectRoot, 'tsconfig.lib.json')],
    eslintFilePatterns: [`${options.projectRoot}/**/*.{ts,spec.ts}`],
    skipFormat: true,
  });

  const eslintFile = findEslintFile(host, options.projectRoot);
  if (useFlatConfig(host)) {
    /**
     * TODO: augment flat config once the plugins are ready with the flat
     */
  } else if (eslintFile) {
    const eslintFilePath = joinPathFragments(options.projectRoot, eslintFile);
    updateJson(host, eslintFilePath, (json) => {
      const ignorePatterns = [...(json.ignorePatterns ?? ['!**/*']), 'references.d.ts', 'node_modules/**/*', 'hooks/**/*', 'platforms/**/*'];
      const extendsVal = [...(json.extends ?? [])];
      delete json.ignorePatterns;
      delete json.extends;
      return {
        extends: extendsVal,
        ignorePatterns,
        ...json,
      };
    });
  }

  return runTasksInSerial(lintTask);
}
