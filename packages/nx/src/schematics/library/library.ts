import { chain, externalSchematic, Rule, Tree, SchematicContext } from '@angular-devkit/schematics';
import { PluginHelpers, prerun } from '../../utils';

export default function (options: any): Rule {
  return chain([
    prerun(options, true),
    PluginHelpers.applyAppNamingConvention(options, 'nativescript'),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic('@nrwl/workspace', 'library', {
        ...options
      }),
  ]);
}