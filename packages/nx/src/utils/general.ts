import { Tree, parseJson, serializeJson, getWorkspacePath, readJson } from '@nrwl/devkit';
import { stringUtils as nxStringUtils, updateWorkspaceInTree } from '@nrwl/workspace';

export interface IPluginSettings {
  prefix?: string;
  groupByName?: boolean;
  framework?: FrameworkTypes;
}

export type PlatformTypes = 'nativescript';
export const supportedPlatforms: Array<PlatformTypes> = [
  'nativescript',
];
export type FrameworkTypes = 'angular';
// TODO: support react, svelte, vue
// | 'react'
// | 'svelte
// | 'vue'
export const supportedFrameworks: Array<FrameworkTypes> = ['angular']; //, 'react', 'svelte', 'vue']
export const supportedSandboxPlatforms: Array<PlatformTypes> = ['nativescript'];

// various plugin settings - workspace can be setup using these possible keys
// this plugin works under the hood of xplat as well
export const packageSettingKeys = {
  nativescriptNx: 'nativescript-nx',
  xplat: 'xplat'
}

let npmScope: string;
// selector prefix to use when generating various boilerplate components
let prefix: string;
// user preferred default framework
let frontendFramework: FrameworkTypes;
// Group by app name (appname-platform) instead of the default (platform-appname)
let groupByName = false;
let usingXplatWorkspace = false;

export function getNpmScope() {
  return npmScope;
}

export function getPrefix() {
  return prefix;
}

export function getFrontendFramework() {
  return frontendFramework;
}

export function getGroupByName() {
  return groupByName;
}

export function getAppName(options: any, platform: PlatformTypes) {
  return groupByName
    ? options.name.replace(`-${platform}`, '')
    : options.name.replace(`${platform}-`, '');
}

export function isXplatWorkspace() {
  return usingXplatWorkspace;
}

export function applyAppNamingConvention(
  options: any,
  platform: PlatformTypes
) {
    const { name, directory } = getAppNamingConvention(options, platform);
    options.name = name;
    options.directory = directory;
}

export function getAppNamingConvention(
  options: any,
  platform: PlatformTypes
) {
  let name = '';
  let directory = '';
  if (options.directory) {
    directory = toFileName(options.directory);
    if (
      directory === platform &&
      supportedPlatforms.includes(<PlatformTypes>directory)
    ) {
      name = toFileName(options.name);
    } else {
      name = getPlatformName(options.name, platform);
    }
  } else {
    name = getPlatformName(options.name, platform);
  }
  return {
    name,
    directory,
  };
}

export function getPlatformName(name: string, platform: PlatformTypes) {
  const nameSanitized = toFileName(name);
  return getGroupByName()
    ? `${nameSanitized}-${platform}`
    : `${platform}-${nameSanitized}`;
}

export function getDefaultTemplateOptions() {
  // console.log('getDefaultTemplateOptions getPrefix:', getPrefix());
  return {
    tmpl: '',
    utils: stringUtils,
    npmScope: getNpmScope(),
    prefix: getPrefix(),
    dot: '.',
  };
}

export function prerun(tree: Tree, options?: any, init?: boolean) {

    const nxJson = getNxWorkspaceConfig(tree);
    if (nxJson) {
      npmScope = nxJson.npmScope || 'workspace';
    }
    // console.log('npmScope:', npmScope);
    const packageJson = getJsonFromFile(tree, 'package.json');

    let frameworkChoice: string;
    if (options && options.framework) {
      // can actually specify comma delimited list of frameworks to generate support for
      // most common to generate 1 at a time but we allow multiple
      const frameworks = sanitizeCommaDelimitedArg(options.framework);
      // always default framework choice to first in list when multiple
      // when it's just one (most common) will be first already
      frameworkChoice = frameworks[0];
    }
    // console.log('frameworkChoice:', frameworkChoice);

    if (packageJson) {
      prefix = '';
      const pluginSettings = packageJson[packageSettingKeys.nativescriptNx] || packageJson[packageSettingKeys.xplat];
      if (pluginSettings) {
        usingXplatWorkspace = !!packageJson[packageSettingKeys.xplat];
        // use persisted settings
        prefix = pluginSettings.prefix || npmScope; // (if not prefix, default to npmScope)
        frontendFramework = pluginSettings.framework;

        if (options) {
          if (options.prefix) {
            // always use explicit prefix user passed in
            prefix = options.prefix;
          } else {
            // ensure options are updated
            options.prefix = prefix;
          }
          if (frameworkChoice) {
            // always override default framework when user has explicitly passed framework option in
            frontendFramework = <FrameworkTypes>frameworkChoice;
          }
        }
        // grouping
        groupByName =
        pluginSettings.groupByName || (options ? options.groupByName : false);
      } else if (options) {
        groupByName = options.groupByName;
        if (options.prefix) {
          if (!prefix && init) {
            // initializing for first time
            prefix = options.prefix;
          }
        } else {
          // default to npmScope for prefix
          options.prefix = npmScope;
        }
        if (frameworkChoice) {
          if (!frontendFramework && init) {
            frontendFramework = <FrameworkTypes>frameworkChoice;
          }
        }
      }
    }
    // console.log('prefix:', prefix);

}

export function jsonParse(content: string) {
  if (content) {
    // ensure comments are stripped when parsing (otherwise will fail)
    return parseJson(content);
  }
  return {};
}

export function getJsonFromFile(tree: Tree, path: string) {
  // console.log('getJsonFromFile:', path)
  return jsonParse(tree.read(path).toString('utf-8'));
}

export function updateJsonFile(tree: Tree, path: string, jsonData: any) {
  try {
    tree.write(path, serializeJson(jsonData));
  } catch (err) {
    // console.warn(err);
    throw new Error(`${path}: ${err}`);
  }
}

export function updateFile(tree: Tree, path: string, content: string) {
  try {
    // if (tree.exists(path)) {
    tree.write(path, content);
    // }
    return tree;
  } catch (err) {
    // console.warn(err);
    throw new Error(`${path}: ${err}`);
  }
}

export function updatePackageScripts(tree: Tree, scripts: any) {
  const path = 'package.json';
  const packageJson = getJsonFromFile(tree, path);
  const scriptsMap = Object.assign({}, packageJson.scripts);
  packageJson.scripts = Object.assign(scriptsMap, scripts);
  return updateJsonFile(tree, path, packageJson);
}

export function readWorkspaceJson(tree: Tree) {
  return readJson(tree, getWorkspacePath(tree));
}

export function updateWorkspace(updates: any) {
  return <any>updateWorkspaceInTree((json) => {
    for (const key in updates) {
      json[key] = {
        ...(json[key] || {}),
        ...updates[key],
      };
    }
    return json;
  });
}

export function updateNxProjects(tree: Tree, projects: any) {
  const path = 'nx.json';
  const nxJson = getJsonFromFile(tree, path);
  const projectsMap = Object.assign({}, nxJson.projects);
  nxJson.projects = Object.assign(projectsMap, projects);
  return updateJsonFile(tree, path, nxJson);
}

export function getNxWorkspaceConfig(tree: Tree): any {
  const nxConfig = getJsonFromFile(tree, 'nx.json');
  const hasWorkspaceDirs = tree.exists('libs') || tree.exists('packages');

  // determine if Nx workspace
  if (nxConfig) {
    if (nxConfig.npmScope || hasWorkspaceDirs) {
      return nxConfig;
    }
  }
  throw new Error(
    '@nativescript/nx must be used inside an Nx workspace. Create a workspace first. https://nx.dev'
  );
}

export function sanitizeCommaDelimitedArg(input: string): Array<string> {
  if (input) {
    return input
      .split(',')
      .filter((i) => !!i)
      .map((i) => i.trim().toLowerCase());
  }
  return [];
}

/**
 * Sanitizes a given string by removing all characters that
 * are not letters or digits.
 *
 ```javascript
 sanitize('nativescript-app');  // 'nativescriptapp'
 sanitize('action_name');       // 'actioname'
 sanitize('css-class-name');    // 'cssclassname'
 sanitize('my favorite items'); // 'myfavoriteitems'
 ```

 @method sanitize
 @param {String} str The string to sanitize.
 @return {String} the sanitized string.
*/
export const sanitize = (str: string): string =>
  str
    .split('')
    .filter((char) => /[a-zA-Z0-9]/.test(char))
    .join('');

export function toFileName(s: string): string {
  return s
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[ _]/g, '-');
}

export const stringUtils = { sanitize, ...nxStringUtils };