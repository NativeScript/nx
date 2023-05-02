import { Tree, updateJson } from '@nrwl/devkit';
import { initGenerator } from '@nrwl/js';
import { nsCoreVersion, nsTypesVersion, nsThemeVersion } from '../../utils/versions';
import { Schema } from './schema';

export async function init(tree: Tree, options: Schema) {
  initGenerator(tree, {
    skipFormat: true,
  });
  updateJson(tree, 'package.json', json => {
    if (!json.dependencies) {
      json.dependencies = {};
    }
    if (!json.dependencies['@nativescript/core']) {
      json.dependencies['@nativescript/core'] = nsCoreVersion;
    }
    if (!json.dependencies['@nativescript/theme']) {
      json.dependencies['@nativescript/theme'] = nsThemeVersion;
    }
    if (!json.devDependencies) {
      json.devDependencies = {};
    }
    if (!json.devDependencies['@nativescript/types']) {
      json.devDependencies['@nativescript/types'] = nsTypesVersion;
    }

    return json;
  });
}

export default init;