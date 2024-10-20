import { generateFiles, joinPathFragments, Tree } from '@nx/devkit';
import { ApplicationSchema, NormalizedSchema } from '../schema';
import { getDefaultTemplateOptions, getFrontendFramework } from '../../../utils';
import {
  angularVersion,
  nsAndroidRuntimeVersion,
  nsAngularVersion,
  nsCoreVersion,
  nsIOSRuntimeVersion,
  nsNgToolsVersion,
  nsWebpackVersion,
  rxjsVersion,
  typescriptVersion,
  zonejsVersion,
} from '../../../utils/versions';

export function createFiles(tree: Tree, options: ApplicationSchema & Partial<NormalizedSchema>, extra = '') {
  const framework = options.framework || getFrontendFramework() || 'angular';
  if (typeof options.routing === 'undefined') {
    // ensure it's at least defined
    options.routing = false;
  }
  generateFiles(tree, joinPathFragments(__dirname, '..', `files${framework ? '_' + framework : ''}${extra ? '_' + extra : ''}`), options.projectRoot, {
    ...options,
    ...getDefaultTemplateOptions(tree),
    angularVersion,
    nsAngularVersion,
    nsCoreVersion,
    nsWebpackVersion,
    nsNgToolsVersion,
    rxjsVersion,
    zonejsVersion,
    typescriptVersion,
    nsIOSRuntimeVersion,
    nsAndroidRuntimeVersion,
  });
}
