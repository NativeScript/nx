import { formatFiles, GeneratorCallback, joinPathFragments, runTasksInSerial, Tree, updateJson } from '@nx/devkit';
import { getAppNamingConvention, missingArgument, preRun, TsConfigJson } from '../../utils';
import { libraryGenerator as jsLibraryGenerator } from '@nx/js';
import { assertNotUsingTsSolutionSetup } from '@nx/js/src/utils/typescript/ts-solution-setup';
import { normalizeOptions } from './lib/normalize-options';
import { LibrarySchema, NormalizedSchema } from './schema';
import { createFiles } from './lib/create-files';
import { updateTsConfig } from './lib/update-ts-config';

export async function libraryGenerator(tree: Tree, schema: LibrarySchema & Partial<NormalizedSchema>) {
  assertNotUsingTsSolutionSetup(tree, 'nativescript', 'library');

  if (!schema.directory) {
    throw new Error(missingArgument('name', 'Provide a directory for your NativeScript lib.', 'nx g @nativescript/nx:lib <directory>'));
  }
  const commonOptions = preRun(tree, schema, true);
  schema = { ...schema, ...getAppNamingConvention(schema, 'nativescript') };

  const options = await normalizeOptions(tree, schema);

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

  createFiles(tree, options);
  updateTsConfig(tree, options);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default libraryGenerator;
