import { generateFiles, joinPathFragments, Tree, readJson } from '@nx/devkit';
import { getDefaultTemplateOptions, PluginHelpers, prerun, updateJsonFile } from '../../utils';
import { initGenerator, libraryGenerator } from '@nx/js';

export async function library(tree: Tree, options: any) {
  prerun(tree, options, true);
  PluginHelpers.applyAppNamingConvention(tree, options, 'nativescript');
  await initGenerator(tree, {
    skipFormat: true,
  });
  await libraryGenerator(tree, {
    name: options.name,
    directory: options.directory,
  });

  // add extra files
  const directory = options.directory ? `${options.directory}/` : '';
  generateFiles(tree, joinPathFragments(__dirname, 'files'), `libs/${directory}${options.name}`, {
    ...(options as any),
    ...getDefaultTemplateOptions(),
    pathOffset: directory ? '../../../' : '../../',
  });

  // update library tsconfig for {N} development
  const tsConfigPath = `libs/${directory}${options.name}/tsconfig.json`;
  const tsConfigJson = readJson(tree, tsConfigPath);
  if (tsConfigJson && tsConfigJson.files) {
    tsConfigJson.files.push('./references.d.ts');
  }
  if (tsConfigJson && tsConfigJson.include) {
    tsConfigJson.include.push('**/*.ts');
  }
  updateJsonFile(tree, tsConfigPath, tsConfigJson);
}

export default library;
