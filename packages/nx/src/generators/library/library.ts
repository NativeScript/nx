import { formatFiles, generateFiles, GeneratorCallback, joinPathFragments, runTasksInSerial, Tree, updateJson } from '@nx/devkit';
import { getAppNamingConvention, getDefaultTemplateOptions, missingArgument, preRun, TsConfigJson } from '../../utils';
import { libraryGenerator as jsLibraryGenerator } from '@nx/js';
import { assertNotUsingTsSolutionSetup } from '@nx/js/src/utils/typescript/ts-solution-setup';
import { normalizeOptions } from './lib/normalize-options';
import { LibrarySchema, NormalizedSchema } from './schema';

export async function libraryGenerator(tree: Tree, options: LibrarySchema & Partial<NormalizedSchema>) {
  assertNotUsingTsSolutionSetup(tree, 'nativescript', 'library');

  if (!options.directory) {
    throw new Error(missingArgument('name', 'Provide a directory for your NativeScript lib.', 'nx g @nativescript/nx:lib <directory>'));
  }
  const commonOptions = preRun(tree, options, true);
  options = { ...options, ...getAppNamingConvention(options, 'nativescript') };

  options = await normalizeOptions(tree, options);

  const tasks: GeneratorCallback[] = [];

  const jsLibGeneratorOptions: Parameters<typeof jsLibraryGenerator>[1] = {
    directory: options.directory,
    name: options.name,
    skipTsConfig: options.skipTsConfig,
    skipFormat: true,
    tags: options.tags,
    unitTestRunner: options.unitTestRunner,
    linter: options.linter,
    testEnvironment: options.testEnvironment,
    importPath: options.importPath,
    pascalCaseFiles: options.pascalCaseFiles,
    js: options.js,
  };
  tasks.push(await jsLibraryGenerator(tree, jsLibGeneratorOptions));

  // add extra files
  generateFiles(tree, joinPathFragments(__dirname, 'files'), options.projectRoot, {
    ...options,
    ...getDefaultTemplateOptions(tree),
  });

  // update library tsconfig for {N} development
  updateJson(tree, joinPathFragments(options.projectRoot, 'tsconfig.json'), (tsConfigJson: TsConfigJson) => {
    const updatedTsConfigJson: TsConfigJson = {
      ...tsConfigJson,
    };
    if (updatedTsConfigJson.files) {
      updatedTsConfigJson.files.push('./references.d.ts');
    }
    if (updatedTsConfigJson.include) {
      updatedTsConfigJson.include.push('**/*.ts');
    }
    return updatedTsConfigJson;
  });

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default libraryGenerator;
