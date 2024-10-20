import { joinPathFragments, Tree, updateJson } from '@nx/devkit';
import { NormalizedSchema } from '../schema';
import { TsConfigJson } from '../../../utils';

export function updateTsConfig(tree: Tree, options: NormalizedSchema) {
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
}
