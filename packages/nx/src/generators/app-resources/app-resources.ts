import {
  Tree,
  generateFiles,
  joinPathFragments
} from '@nrwl/devkit';
import { PluginHelpers, getDefaultTemplateOptions } from '../../utils';

import { Schema as AppResourcesSchema } from './schema';

export function appResources(tree: Tree, options: AppResourcesSchema) {
  generateFiles(tree, joinPathFragments(__dirname, 'files'), options.path, {
    ...getDefaultTemplateOptions(),
    name: options.name || 'App_Resources',
    libFolderName: PluginHelpers.getLibFoldername('nativescript'),
  });
}

export default appResources;
