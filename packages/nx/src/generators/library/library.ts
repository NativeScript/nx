import { generateFiles, joinPathFragments, Tree } from '@nrwl/devkit';
import { getDefaultTemplateOptions, getJsonFromFile, PluginHelpers, prerun, updateJsonFile } from '../../utils';
import { libraryGenerator } from '@nrwl/workspace';

export function library(tree: Tree, options: any) {

    prerun(tree, options, true);
    PluginHelpers.applyAppNamingConvention(tree, options, 'nativescript'),
    libraryGenerator(tree, options)

      // add extra files
      const directory = options.directory ? `${options.directory}/` : '';
      generateFiles(tree, joinPathFragments(__dirname, 'files'), `libs/${directory}${options.name}`, {
        ...(options as any),
        ...getDefaultTemplateOptions(),
        pathOffset: directory ? '../../../' : '../../',
      })

      // update library tsconfig for {N} development
      const tsConfigPath = `libs/${directory}${options.name}/tsconfig.json`;
      const tsConfigJson = getJsonFromFile(tree, tsConfigPath);
      if (tsConfigJson && tsConfigJson.files) {
        tsConfigJson.files.push('./references.d.ts');
      }
      if (tsConfigJson && tsConfigJson.include) {
        tsConfigJson.include.push('**/*.ts');
      }
      updateJsonFile(tree, tsConfigPath, tsConfigJson);
    
}

export default library;