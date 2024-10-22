import { Tree, readJson, normalizePath } from '@nx/devkit';
import * as nxStringUtils from '@nx/devkit/src/utils/string-utils';
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope';
import { basename } from 'node:path/posix';
import { CommonSchema } from './helpers';

export interface IPluginSettings {
  prefix?: string;
  groupByName?: boolean;
  framework?: FrameworkTypes;
}

export type PlatformTypes = 'nativescript';
export type FrameworkTypes = 'angular' | 'vanilla';
// TODO: support react, svelte, vue
// | 'react'
// | 'svelte
// | 'vue'

export const supportedPlatforms: Readonly<PlatformTypes[]> = ['nativescript'];
export const supportedFrameworks: Readonly<FrameworkTypes[]> = ['angular']; //, 'react', 'svelte', 'vue']
// various workspace settings - workspace can be setup using these possible keys
// this plugin works under the hood of xplat as well
export const enum WorkspaceSetting {
  NATIVESCRIPT_NX = 'nativescript-nx',
  XPLAT = 'xplat',
}

// selector prefix to use when generating various boilerplate components
let prefix: string;
// user preferred default framework
let frontendFramework: FrameworkTypes;
// Group by app name (appname-platform) instead of the default (platform-appname)
let groupByName = false;
let usingXplatWorkspace = false;

export function getPrefix() {
  return prefix;
}

export function getFrontendFramework() {
  return frontendFramework;
}

export function getGroupByName() {
  return groupByName;
}

export function getBaseName(options: { directory: string }, platform: PlatformTypes) {
  const name = basename(normalizePath(options.directory));
  return groupByName ? name.replace(`-${platform}`, '') : name.replace(`${platform}-`, '');
}

export function isXplatWorkspace() {
  return usingXplatWorkspace;
}

export function inferPluginSettingKey() {
  return isXplatWorkspace() ? WorkspaceSetting.XPLAT : WorkspaceSetting.NATIVESCRIPT_NX;
}

export function getDefaultTemplateOptions(tree: Tree) {
  return {
    tmpl: '',
    utils: stringUtils,
    npmScope: getNpmScope(tree),
    prefix: getPrefix(),
    dot: '.',
    standaloneAsDefault: false,
  };
}

export function preRun(tree: Tree, options?: Readonly<CommonSchema>, init?: boolean) {
  const packageJson = readJson(tree, 'package.json');
  const updatedCommonOptions: CommonSchema = {
    prefix: options.prefix,
    framework: options.framework,
    groupByName: options.groupByName,
    isTesting: options.isTesting,
  };

  let frameworkChoice: string;
  if (options && options.framework) {
    // can actually specify comma-delimited list of frameworks to generate support for
    // most common to generate 1 at a time, but we allow multiple
    const frameworks = sanitizeCommaDelimitedArg(options.framework);
    // always default framework choice to first in list when multiple
    // when it's just one (most common) will be first already
    frameworkChoice = frameworks[0];
  }

  if (packageJson) {
    prefix = '';
    const pluginSettings = packageJson[WorkspaceSetting.NATIVESCRIPT_NX] || packageJson[WorkspaceSetting.XPLAT];
    if (pluginSettings) {
      usingXplatWorkspace = !!packageJson[WorkspaceSetting.XPLAT];
      // use persisted settings
      prefix = pluginSettings.prefix || getNpmScope(tree); // (if not prefix, default to npmScope)
      frontendFramework = pluginSettings.framework;

      if (options) {
        if (options.prefix) {
          // always use explicit prefix user passed in
          prefix = options.prefix;
        } else {
          // ensure options are updated
          updatedCommonOptions.prefix = prefix;
        }
        if (frameworkChoice) {
          // always override default framework when user has explicitly passed framework option in
          frontendFramework = <FrameworkTypes>frameworkChoice;
        }
      }
      // grouping
      groupByName = pluginSettings.groupByName || (options ? options.groupByName : false);
    } else if (options) {
      groupByName = options.groupByName;
      if (options.prefix) {
        if (!prefix && init) {
          // initializing for first time
          prefix = options.prefix;
        }
      } else {
        // default to npmScope for prefix
        updatedCommonOptions.prefix = getNpmScope(tree);
      }
      if (frameworkChoice) {
        if (!frontendFramework && init) {
          frontendFramework = <FrameworkTypes>frameworkChoice;
        }
      }
    }
  }
  return updatedCommonOptions;
}

export function sanitizeCommaDelimitedArg(input: string): string[] {
  if (input) {
    return input
      .split(',')
      .filter((i) => !!i?.trim())
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
