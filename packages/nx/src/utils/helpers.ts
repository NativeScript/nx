import { Tree, updateJson, normalizePath, addDependenciesToPackageJson } from '@nx/devkit';
import {
  FrameworkTypes,
  getGroupByName,
  inferPluginSettingKey,
  getPrefix,
  IPluginSettings,
  PlatformTypes,
  sanitizeCommaDelimitedArg,
  toFileName,
} from './general';
import { VersionedPackage, versions } from './versions';
import { PackageJson } from 'nx/src/utils/package-json';
import { CompilerOptions } from 'typescript';
import { LibrarySchema } from '../generators/library/schema';
import { basename, sep } from 'node:path/posix';

export type UnitTestRunner = 'jest' | 'none';

export type TsConfigJson = {
  compilerOptions: CompilerOptions;
  exclude: string[];
  compileOnSave: boolean;
  extends: string;
  files: string[];
  include: string[];
};

export interface CommonSchema {
  /**
   * Target frameworks
   */
  framework?: string;
  /**
   * The prefix to apply to generated selectors.
   */
  prefix?: string;
  /**
   * group by name
   */
  groupByName?: boolean;
  /**
   * testing helper
   */
  isTesting?: boolean;
}

export function getFrameworksFromOptions(frameworkArgument: string) {
  // will support comma-delimited list of frameworks to generate support for
  // most common to generate 1 at a time, but we will allow multiple
  // always default framework choice to first in list when multiple
  return sanitizeCommaDelimitedArg(frameworkArgument) as FrameworkTypes[];
}

export function getFrameworkChoice(frameworkArgument: string, frameworks?: FrameworkTypes[]) {
  frameworks = frameworks || getFrameworksFromOptions(frameworkArgument);
  return frameworks.length ? frameworks[0] : null;
}

function pickVersions(packages: VersionedPackage[]): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const name of packages) {
    picked[name] = versions[name];
  }
  return picked;
}

export function updatePluginDependencies(tree: Tree, options: CommonSchema) {
  let frameworkDependencies: PackageJson['dependencies'] = {};
  let frameworkDevDependencies: PackageJson['devDependencies'] = {};
  switch (options.framework) {
    case 'angular':
      frameworkDependencies = pickVersions([
        '@nativescript/angular',
        '@angular/animations',
        '@angular/common',
        '@angular/compiler',
        '@angular/core',
        '@angular/forms',
        '@angular/platform-browser',
        '@angular/router',
        'rxjs',
      ]);
      frameworkDevDependencies = pickVersions(['@angular-devkit/build-angular', '@angular/compiler-cli', '@nativescript/tailwind', '@ngtools/webpack', 'ajv', 'tailwindcss']);
      break;
  }
  return addDependenciesToPackageJson(
    tree,
    {
      '@nativescript/core': versions['@nativescript/core'],
      ...frameworkDependencies,
    },
    {
      '@nativescript/webpack': versions['@nativescript/webpack'],
      '@nativescript/types': versions['@nativescript/types'],
      ...frameworkDevDependencies,
    },
  );
}

export function getUpdatedPluginSettings(options: CommonSchema) {
  const prefix = getPrefix();
  const frameworks = getFrameworksFromOptions(options.framework);
  const frameworkChoice = getFrameworkChoice(options.framework, frameworks);
  const pluginSettings: IPluginSettings = {
    prefix,
  };
  if (frameworkChoice && frameworks.length === 1) {
    // when only 1 framework is specified, auto add as default
    pluginSettings.framework = frameworkChoice;
  }
  if (options.groupByName) {
    pluginSettings.groupByName = true;
  }
  return pluginSettings;
}

export function updatePluginSettings(tree: Tree, options: CommonSchema) {
  const packageJsonPath = 'package.json';
  if (tree.exists(packageJsonPath)) {
    // could introduce another json config file but trying to avoid too much extra overhead so just store in package.json for now
    const pluginSettings: IPluginSettings = getUpdatedPluginSettings(options);
    const pluginSettingsKey = inferPluginSettingKey();
    // update root dependencies for the generated support
    updateJson(tree, packageJsonPath, (packageJson) => {
      return {
        ...packageJson,
        [pluginSettingsKey]: {
          ...(packageJson[pluginSettingsKey] ?? {}),
          ...pluginSettings,
        },
      };
    });
  }
}

/**
 * Returns a name with the platform.
 *
 * @example (app, nativescript) => nativescript-app or app-nativescript
 * @param name
 * @param platform
 */
export function getPlatformName(name: string, platform: PlatformTypes) {
  const nameSanitized = toFileName(name);
  return getGroupByName()
    ? !nameSanitized.endsWith(`-${platform}`)
      ? `${nameSanitized}-${platform}`
      : nameSanitized
    : !nameSanitized.startsWith(`-${platform}`)
      ? `${platform}-${nameSanitized}`
      : nameSanitized;
}

export function getAppNamingConvention(
  options: LibrarySchema,
  platform: PlatformTypes,
): {
  name?: string;
  directory: string;
} {
  let name: string | undefined = options.name;
  let directory = normalizePath(options.directory);
  const baseDir = basename(directory);
  const newBaseDir = getPlatformName(baseDir, platform);
  const directoryElements = directory.split(sep);
  directoryElements[directoryElements.length - 1] = newBaseDir;
  directory = directoryElements.join(sep);
  if (name) {
    name = getPlatformName(name, platform);
  }
  return {
    name,
    directory,
  };
}

// Copied from: https://github.com/NativeScript/nativescript-cli/blob/16064affee98c837e8cbe0865254dcb5b81f0bbe/lib/common/helpers.ts#L246C1-L268C2
// For https://github.com/NativeScript/nativescript-cli/pull/5808
function bashQuote(s: string): string {
  if (s[0] === "'" && s[s.length - 1] === "'") {
    return s;
  }
  // replace ' with '"'"' and wrap in ''
  return "'" + s.replace(/'/g, "'\"'\"'") + "'";
}

function cmdQuote(s: string): string {
  if (s[0] === '"' && s[s.length - 1] === '"') {
    return s;
  }
  // replace " with \" and wrap in ""
  return '"' + s.replace(/"/g, '\\"') + '"';
}

export function quoteString(s: string): string {
  if (!s) {
    return s;
  }

  return process.platform === 'win32' ? cmdQuote(s) : bashQuote(s);
}
