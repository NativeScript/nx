import { Tree, generateFiles, joinPathFragments } from '@nx/devkit';
import { getDefaultTemplateOptions } from '../../utils';

import { Schema as AppResourcesSchema } from './schema';

export function appResources(tree: Tree, options: AppResourcesSchema) {
  generateFiles(tree, joinPathFragments(__dirname, 'files'), options.path, {
    ...getDefaultTemplateOptions(tree),
    name: options.name ?? 'App_Resources',
  });
}

export default appResources;
