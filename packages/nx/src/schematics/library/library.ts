import { apply, branchAndMerge, chain, externalSchematic, mergeWith, move, noop, Rule, SchematicContext, SchematicsException, template, Tree, url } from '@angular-devkit/schematics';
import { getDefaultTemplateOptions, getJsonFromFile, PluginHelpers, prerun, updateJsonFile } from '../../utils';

export default function (options: any): Rule {
  return chain([
    prerun(options, true),
    PluginHelpers.applyAppNamingConvention(options, 'nativescript'),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic('@nrwl/workspace', 'library', {
        ...options,
      }),
    (tree: Tree, context: SchematicContext) => {
      // add extra files
      return addExtraLibFiles(options);
    },
    (tree: Tree, context: SchematicContext) => {
      // update library tsconfig for {N} development
      const directory = options.directory ? `${options.directory}/` : '';
      const tsConfigPath = `libs/${directory}${options.name}/tsconfig.json`;
      const tsConfigJson = getJsonFromFile(tree, tsConfigPath);
      if (tsConfigJson && tsConfigJson.files) {
        tsConfigJson.files.push('./references.d.ts');
      }
      if (tsConfigJson && tsConfigJson.include) {
        tsConfigJson.include.push('**/*.ts');
      }
      return updateJsonFile(tree, tsConfigPath, tsConfigJson);
    },
  ]);
}

function addExtraLibFiles(options: any): Rule {
  const directory = options.directory ? `${options.directory}/` : '';
  return branchAndMerge(
    mergeWith(
      apply(url(`./files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions(),
          pathOffset: directory ? '../../../' : '../../',
        }),
        move(`libs/${directory}${options.name}`),
      ])
    )
  );
}

function getLibName(options: any) {

}