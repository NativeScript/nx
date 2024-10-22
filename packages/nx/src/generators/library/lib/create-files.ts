import { generateFiles, joinPathFragments, Tree } from '@nx/devkit';
import { NormalizedSchema } from '../schema';
import { getDefaultTemplateOptions } from '../../../utils';

export function createFiles(tree: Tree, options: NormalizedSchema) {
  generateFiles(tree, joinPathFragments(__dirname, '..', 'files'), options.projectRoot, {
    ...options,
    ...getDefaultTemplateOptions(tree),
  });
}
