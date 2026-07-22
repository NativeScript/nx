import { generateFiles, joinPathFragments, Tree } from '@nx/devkit';
import { NormalizedSchema } from '../schema';
import { getDefaultTemplateOptions, getFrontendFramework } from '../../../utils';
import { versions } from '../../../utils/versions';

export function createFiles(tree: Tree, options: NormalizedSchema, extra = '') {
  const framework = options.framework || getFrontendFramework() || 'angular';
  if (typeof options.routing === 'undefined') {
    // ensure it's at least defined
    options.routing = false;
  }
  generateFiles(tree, joinPathFragments(__dirname, '..', `files${framework ? '_' + framework : ''}${extra ? '_' + extra : ''}`), options.projectRoot, {
    ...options,
    ...getDefaultTemplateOptions(tree),
    nsIOSRuntimeVersion: versions['@nativescript/ios'],
    nsAndroidRuntimeVersion: versions['@nativescript/android'],
    nsTailwindVersion: versions['@nativescript/tailwind'],
  });
}
