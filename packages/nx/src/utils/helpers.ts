import { apply, branchAndMerge, externalSchematic, mergeWith, move, noop, Rule, SchematicContext, SchematicsException, template, Tree, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { toFileName } from '@nrwl/workspace';
import { createSourceFile, ScriptTarget } from 'typescript';
import { addGlobal, insert } from './ast';
import { generateOptionError, unsupportedFrameworkError } from './errors';
import {
  FrameworkTypes,
  getDefaultTemplateOptions,
  getFrontendFramework,
  getGroupByName,
  getJsonFromFile,
  getPrefix,
  IPluginSettings,
  isXplatWorkspace,
  packageSettingKeys,
  PlatformTypes,
  sanitizeCommaDelimitedArg,
  stringUtils,
  supportedFrameworks,
  supportedPlatforms,
  supportedSandboxPlatforms,
  updateJsonFile,
} from './general';
import { nodeSassVersion, nsAngularVersion, nsCoreVersion, nsNgToolsVersion, nsNxPluginVersion, nsRxjs, nsThemeVersion, nsZonejs } from './versions';

export namespace PluginHelpers {
  export interface Schema {
    /**
     * Target frameworks
     */
    framework?: string;
    /**
     * The prefix to apply to generated selectors.
     */
    prefix?: string;
    /**
     * Skip formatting
     */
    skipFormat?: boolean;
    /**
     * Skip dependent platform files
     */
    skipDependentPlatformFiles?: boolean;
    useXplat?: boolean;
    /**
     * Skip install
     */
    skipInstall?: boolean;
    /**
     * group by name
     */
    groupByName?: boolean;
    /**
     * testing helper
     */
    isTesting?: boolean;
  }

  export interface NgAddSchema {
    /**
     * Target platforms
     */
    platforms?: string;
    /**
     * Target frameworks
     */
    framework?: string;
    /**
     * The prefix to apply to generated selectors.
     */
    prefix?: string;
  }

  export interface IPluginGeneratorOptions {
    featureName?: string;
    projectNames?: Array<string>;
    platforms: Array<PlatformTypes>;
  }

  export function getFrameworksFromOptions(frameworkArgument: string) {
    // will support comma delimited list of frameworks to generate support for
    // most common to generate 1 at a time but we will allow multiple
    // always default framework choice to first in list when multiple
    return <Array<FrameworkTypes>>(<unknown>sanitizeCommaDelimitedArg(frameworkArgument));
  }

  export function getFrameworkChoice(frameworkArgument: string, frameworks?: Array<FrameworkTypes>) {
    frameworks = frameworks || getFrameworksFromOptions(frameworkArgument);
    return frameworks.length ? frameworks[0] : null;
  }

  export function updateRootDeps(options: PluginHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const frameworkDependencies: any = {};
      const frameworkDevDependencies: any = {};
      switch (options.framework) {
        case 'angular':
          frameworkDependencies['@nativescript/angular'] = nsAngularVersion;
          frameworkDevDependencies['@ngtools/webpack'] = nsNgToolsVersion;
          frameworkDependencies['@angular/animations'] = nsAngularVersion;
          frameworkDependencies['@angular/common'] = nsAngularVersion;
          frameworkDependencies['@angular/compiler'] = nsAngularVersion;
          frameworkDependencies['@angular/core'] = nsAngularVersion;
          frameworkDependencies['@angular/forms'] = nsAngularVersion;
          frameworkDependencies['@angular/platform-browser'] = nsAngularVersion;
          frameworkDependencies['@angular/platform-browser-dynamic'] = nsAngularVersion;
          frameworkDependencies['@angular/router'] = nsAngularVersion;
          frameworkDependencies['rxjs'] = nsRxjs;
          frameworkDependencies['zone.js'] = nsZonejs;
          break;
      }
      return PluginHelpers.updatePackageForWorkspace(options, {
        dependencies: {
          '@nativescript/core': nsCoreVersion,
          'nativescript-theme-core': nsThemeVersion,
          ...frameworkDependencies,
        },
        devDependencies: {
          'node-sass': nodeSassVersion,
          '@nativescript/types': nsCoreVersion,
          ...frameworkDevDependencies,
        },
      })(tree, context);
    };
  }

  //   export function updatePrettierIgnore() {
  //     return PluginHelpers.updatePrettierIgnore(
  //       `\n
  // # @nativescript/nx added rules
  // **/*.d.ts
  // **/apps/**/platforms/**/*
  // **/App_Resources/**/*
  // **/apps/nativescript*/hooks/**/*
  // **/apps/nativescript*/tools/**/*
  // **/apps/nativescript*/src/assets/*.min.css
  // **/apps/*nativescript/hooks/**/*
  // **/apps/*nativescript/tools/**/*
  // **/apps/*nativescript/src/assets/*.css`,
  //       '**/apps/*nativescript/src/assets/*.css'
  //     );
  //   }

  export function getUpdatedPluginSettings(options: Schema) {
    const frameworks = getFrameworksFromOptions(options.framework);
    const frameworkChoice = PluginHelpers.getFrameworkChoice(options.framework, frameworks);
    const pluginSettings: IPluginSettings = {
      prefix: getPrefix(),
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

  /**
   * Returns a name with the platform.
   *
   * @example (app, nativescript) => nativescript-app or app-nativescript
   * @param name
   * @param platform
   */
  export function getPlatformName(name: string, platform: PlatformTypes) {
    const nameSanitized = toFileName(name);
    return getGroupByName() ? `${nameSanitized}-${platform}` : `${platform}-${nameSanitized}`;
  }

  /**
   * Returns libs folder name dependent on settings.
   *
   * @example ('web', 'angular') => 'web-angular' if no default framework otherwise just 'web'
   * @param platform
   * @param framework
   */
  export function getLibFoldername(platform: PlatformTypes, framework?: FrameworkTypes) {
    const frontendFramework = getFrontendFramework();
    // console.log('getLibFoldername frontendFramework:', frontendFramework);
    // console.log('framework:', framework);
    let frameworkSuffix = '';
    if (framework && frontendFramework !== framework) {
      // user had a default framework set
      // however an explicit framework is being requested
      // if they differ, use suffix to distinguish
      frameworkSuffix = `-${framework}`;
    }
    return `${platform}${frameworkSuffix}`;
  }

  export function getExternalChainsForGenerator(options: Schema, generator: string, packagesToRunXplat: Array<string>) {
    let generatorSettings: IPluginGeneratorOptions;
    let isApp = false;
    switch (generator) {
      case 'component':
        generatorSettings = PluginComponentHelpers.prepare(<any>options);
        break;
      case 'feature':
        generatorSettings = PluginFeatureHelpers.prepare(<any>options);
        break;
      default:
        isApp = ['application', 'app'].includes(generator);
        generatorSettings = {
          platforms: <Array<PlatformTypes>>(<unknown>sanitizeCommaDelimitedArg('nativescript')),
        };
        break;
    }
    const platforms = generatorSettings.platforms;
    const externalChains = [];
    const devDependencies = {};

    // frontend framework
    const frameworks = getFrameworksFromOptions(options.framework);
    const frameworkChoice = getFrameworkChoice(options.framework, frameworks);
    // console.log('frameworks:', frameworks);
    // console.log('frameworkChoice:', frameworkChoice);

    // console.log('platforms:', platforms);
    if (frameworks.length) {
      for (const framework of frameworks) {
        if (supportedFrameworks.includes(framework)) {
          const packageName = `@nativescript/nx-${framework}`;
          devDependencies[packageName] = nsNxPluginVersion;
          // externalChains.push(externalSchematic(`@nstudio/${platform}-${framework}`, 'app', options));
          packagesToRunXplat.push(packageName);
        } else {
          throw new SchematicsException(unsupportedFrameworkError(framework));
        }
      }
    }

    if (Object.keys(devDependencies).length) {
      externalChains.push((tree: Tree, context: SchematicContext) => {
        // console.log(devDependencies);

        return PluginHelpers.updatePackageForWorkspace(options, {
          devDependencies,
        })(tree, context);
      });

      if (options.isTesting) {
        // necessary to unit test the appropriately
        // console.log('packagesToRunXplat:', packagesToRunXplat)
        if (packagesToRunXplat.length) {
          for (const packageName of packagesToRunXplat) {
            externalChains.push(
              externalSchematic(packageName, generator, options, {
                interactive: false,
              })
            );
          }
        }
      } else {
        externalChains.push((tree: Tree, context: SchematicContext) => {
          const installPackageTask = context.addTask(new NodePackageInstallTask());

          // console.log('devDependencies:', devDependencies);
          // console.log('packagesToRunXplat:', packagesToRunXplat);
          for (const packageName of packagesToRunXplat) {
            context.addTask(new RunSchematicTask(packageName, generator, options), [installPackageTask]);
          }
        });
      }
    }
    return externalChains;
  }

  export function getExternalChainsForApplication(options: Schema, generator: string, packagesToRun: Array<string>) {
    let generatorSettings: IPluginGeneratorOptions = {
      platforms: <Array<PlatformTypes>>(<unknown>sanitizeCommaDelimitedArg('nativescript')),
    };
    const platforms = generatorSettings.platforms;
    const externalChains = [];
    const devDependencies = {};
    let targetPlatforms = 0;

    // console.log('platforms:', platforms);

    if (options.isTesting) {
      // necessary to unit test the appropriately
      if (targetPlatforms) {
        externalChains.push(
          externalSchematic('@nativescript/nx', 'app-generate', options, {
            interactive: false,
          })
        );
      }

      if (packagesToRun.length) {
        for (const packageName of packagesToRun) {
          const nxPlatform = <PlatformTypes>packageName.replace('@nrwl/', '');
          const { name, directory } = getAppNamingConvention(options, nxPlatform);

          externalChains.push(
            externalSchematic(
              packageName,
              generator,
              {
                ...options,
                name,
                directory,
              },
              {
                interactive: false,
              }
            )
          );
        }
      }
    } else {
      if (targetPlatforms) {
        externalChains.push(externalSchematic('@nativescript/nx', 'app-generate', options));
      }
      if (packagesToRun.length) {
        externalChains.push((tree: Tree, context: SchematicContext) => {
          const installPackageTask = context.addTask(new NodePackageInstallTask());

          // console.log('devDependencies:', devDependencies);
          // console.log('packagesToRunXplat:', packagesToRunXplat);
          for (const packageName of packagesToRun) {
            const nxPlatform = <PlatformTypes>packageName.replace('@nrwl/', '');
            const { name, directory } = getAppNamingConvention(options, nxPlatform);
            context.addTask(
              new RunSchematicTask(packageName, generator, {
                ...options,
                name,
                directory,
              }),
              [installPackageTask]
            );
          }
        });
      }
    }
    return externalChains;
  }

  export function applyAppNamingConvention(options: any, platform: PlatformTypes): Rule {
    return (tree: Tree, context: SchematicContext) => {
      const { name, directory } = getAppNamingConvention(options, platform);
      options.name = name;
      options.directory = directory;
      // console.log('applyAppNamingConvention:', options);
      // adjusted name, nothing else to do
      return noop()(tree, context);
    };
  }

  export function getAppNamingConvention(options: any, platform: PlatformTypes) {
    let name = '';
    let directory = '';
    if (options.directory) {
      directory = toFileName(options.directory);
      if (directory === platform && supportedPlatforms.includes(<PlatformTypes>directory)) {
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

  export function updatePackageForWorkspace(
    options: Schema,
    updates: {
      dependencies?: { [key: string]: string };
      devDependencies?: { [key: string]: string };
    }
  ) {
    return (tree: Tree, context: SchematicContext) => {
      const packagePath = 'package.json';
      let packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {
        // could introduce another json config file but trying to avoid too much extra overhead so just store in package.json for now

        const pluginSettings: IPluginSettings = getUpdatedPluginSettings(options);
        const pluginSettingsKey = isXplatWorkspace() ? packageSettingKeys.xplat : packageSettingKeys.nativescriptNx;

        if (!updates && pluginSettings) {
          // just updating plugin settings
          packageJson[pluginSettingsKey] = {
            ...(packageJson[pluginSettingsKey] || {}),
            ...pluginSettings,
          };
          return updateJsonFile(tree, packagePath, packageJson);
        } else if (updates) {
          // update root dependencies for the generated support
          packageJson = {
            ...packageJson,
            dependencies: {
              ...(packageJson.dependencies || {}),
              ...(updates.dependencies || {}),
            },
            devDependencies: {
              ...(packageJson.devDependencies || {}),
              ...(updates.devDependencies || {}),
            },
            [pluginSettingsKey]: {
              ...(packageJson[pluginSettingsKey] || {}),
              ...pluginSettings,
            },
          };
          // console.log('updatePackageForWorkspace:', serializeJson(packageJson));
          return updateJsonFile(tree, packagePath, packageJson);
        }
      }
      return tree;
    };
  }

  export function updateGitIgnore() {
    return (tree: Tree) => {
      //       const gitIgnorePath = '.gitignore';
      //       let gitIgnore = tree.get(gitIgnorePath).content.toString();
      //       if (gitIgnore) {
      //         if (gitIgnore.indexOf('libs/**/*.js') === -1) {
      //           gitIgnore += `
      // # libs
      // libs/**/*.js
      // libs/**/*.map
      // libs/**/*.d.ts
      // libs/**/*.metadata.json
      // libs/**/*.ngfactory.ts
      // libs/**/*.ngsummary.json
      //       `;
      //         }
      //       }
      //       return updateFile(tree, gitIgnorePath, gitIgnore);
    };
  }

  export function updatePrettierIgnore(content: string, checkExisting: string) {
    return (tree: Tree) => {
      const prettierFileName = '.prettierignore';
      if (tree.exists(prettierFileName)) {
        let prettier = tree.read(prettierFileName)!.toString('utf-8');
        if (prettier && prettier.indexOf(checkExisting) === -1) {
          // update prettier rules
          prettier = `${prettier}\n${content}`;

          tree.overwrite(prettierFileName, prettier);
        }
      }
      return tree;
    };
  }

  export function addPackageInstallTask(options: Schema) {
    return (tree: Tree, context: SchematicContext) => {
      // let packageTask;
      if (!options.skipInstall) {
        // packageTask = context.addTask(
        //   new NodePackageInstallTask() //options.directory)
        // );
        context.addTask(new NodePackageInstallTask());
      }
    };
  }
}

export namespace PluginComponentHelpers {
  export interface Schema {
    name: string;
    /**
     * Target feature. Default is 'ui' if none specified.
     */
    feature?: string;
    /**
     * Group it in a subfolder of the target feature
     */
    subFolder?: string;
    /**
     * Target apps
     */
    projects?: string;
    /**
     * Only generate for specified projects and ignore shared code
     */
    onlyProject?: boolean;
    /**
     * Target framework
     */
    framework?: string;
    /**
     * Create a base component for maximum cross platform sharing
     */
    createBase?: boolean;
    /**
     * Schematic processing helpers
     */
    needsIndex?: boolean;
    /**
     * Skip formatting
     */
    skipFormat?: boolean;
    /**
     * testing helper
     */
    isTesting?: boolean;
  }

  export function prepare(options: Schema): PluginHelpers.IPluginGeneratorOptions {
    if (!options.name) {
      throw new Error(generateOptionError('component'));
    }

    // reset module globals
    options.needsIndex = false;
    let featureName: string;
    let projectNames = null;
    let platforms = [];

    if (options.feature) {
      featureName = options.feature.toLowerCase();
    }
    const projects = options.projects;
    if (projects) {
      options.onlyProject = true;
      if (!featureName) {
        // no feature targeted, default to shared
        featureName = 'shared';
      }
      // building feature in shared code and in projects
      projectNames = sanitizeCommaDelimitedArg(projects);
      for (const name of projectNames) {
        const projectParts = name.split('-');
        const platPrefix = projectParts[0];
        const platSuffix = projectParts.pop();
        if (supportedPlatforms.includes(platPrefix) && !platforms.includes(platPrefix)) {
          // if project name is prefixed with supported platform and not already added
          platforms.push(platPrefix);
        } else if (supportedPlatforms.includes(platSuffix) && !platforms.includes(platSuffix)) {
          platforms.push(platSuffix);
        }
      }
    } else {
      if (!featureName) {
        // no feature targeted, default to ui
        featureName = 'ui';
      }
      // building feature in shared code only
      platforms = sanitizeCommaDelimitedArg('nativescript');
    }
    return { featureName, projectNames, platforms };
  }
}

export namespace PluginFeatureHelpers {
  export interface Schema {
    name: string;
    /**
     * Target apps
     */
    projects?: string;
    /**
     * Target platforms
     */
    platforms?: string;
    framework?: string;
    /**
     * Only generate for specified projects and ignore shared code
     */
    onlyProject?: boolean;
    /**
     * Only generate the module and ignore default component creation
     */
    onlyModule?: boolean;
    /**
     * Configure routing
     */
    routing?: boolean;
    /**
     * Create base component for maximum code sharing
     */
    createBase?: boolean;
    /**
     * Add link to route for sandbox
     */
    adjustSandbox?: boolean;
    /**
     * Skip formatting
     */
    skipFormat?: boolean;
    /**
     * testing helper
     */
    isTesting?: boolean;
  }

  export function prepare(options: Schema): PluginHelpers.IPluginGeneratorOptions {
    if (!options.name) {
      throw new SchematicsException(`You did not specify the name of the feature you'd like to generate. For example: nx g @nativescript/nx:feature my-feature`);
    }
    const featureName = options.name.toLowerCase();
    let projects = options.projects;
    let projectNames: Array<string>;
    let platforms = [];
    if (options.adjustSandbox) {
      // when adjusting sandbox for the feature, turn dependent options on
      // for convenience also setup some default fallbacks to avoid requiring so many options
      // sandbox flags are meant to be quick and convenient
      options.onlyProject = true;
      options.routing = true;
      if (!projects) {
        if (!options.platforms) {
          // default to {N} sandbox
          projects = 'nativescript-sandbox';
        } else {
          platforms = sanitizeCommaDelimitedArg(options.platforms);
          const projectSandboxNames = [];
          // default to project with sandbox name
          for (const p of platforms) {
            if (supportedSandboxPlatforms.includes(p)) {
              projectSandboxNames.push(`${p}-sandbox`);
            } else {
              throw new SchematicsException(`The --adjustSandbox flag supports the following at the moment: ${supportedSandboxPlatforms}`);
            }
          }
          projects = projectSandboxNames.join(',');
        }
      }
    }
    if (options.routing && !options.onlyProject) {
      throw new SchematicsException(`When generating a feature with the --routing option, please also specify --onlyProject. Support for shared code routing is under development.`);
    }

    if (projects) {
      // building feature in shared code and in projects
      projectNames = sanitizeCommaDelimitedArg(projects);
      for (const name of projectNames) {
        let projectName = name;
        if (name.indexOf('/') > -1) {
          projectName = name.split('/').pop();
        }
        const projectParts = projectName.split('-');
        const platPrefix = <PlatformTypes>projectParts[0];
        const platSuffix = <PlatformTypes>projectParts.pop();
        if (supportedPlatforms.includes(platPrefix) && !platforms.includes(platPrefix)) {
          // if project name is prefixed with supported platform and not already added
          platforms.push(platPrefix);
        } else if (supportedPlatforms.includes(platSuffix) && !platforms.includes(platSuffix)) {
          // if project name is suffixed with supported platform and not already added
          platforms.push(platSuffix);
        }
      }
    } else if (options.platforms) {
      // building feature in shared code only
      platforms = sanitizeCommaDelimitedArg(options.platforms);
    }
    // if (platforms.length === 0 && !options.onlyModule) {
    //   let error = projects
    //     ? platformAppPrefixError()
    //     : generatorError('feature');
    //   throw new SchematicsException(optionsMissingError(error));
    // }
    return { featureName, projectNames, platforms };
  }

  export function addFiles(options: Schema, target: string = '', projectName: string = '', extra: string = '', framework?: FrameworkTypes) {
    let moveTo: string;
    if (target) {
      moveTo = getMoveTo(options, target, projectName, framework);
    } else {
      target = 'lib';
      moveTo = `libs/features/${options.name.toLowerCase()}`;
    }
    if (!extra) {
      // make sure no `null` or `undefined` values get in the string path
      extra = '';
    }
    // console.log('target:', target);
    // console.log('addFiles moveTo:', moveTo);
    // console.log('add files from:', `${workingDirectory}/${extra}_files`);
    return branchAndMerge(mergeWith(apply(url(`./${extra}_files`), [template(getTemplateOptions(options, target, framework)), move(moveTo)])));
  }

  export function adjustBarrelIndex(options: Schema, indexFilePath: string): Rule {
    return (tree: Tree) => {
      // console.log('adjustBarrelIndex indexFilePath:', indexFilePath);
      // console.log('tree.exists(indexFilePath):', tree.exists(indexFilePath));
      const indexSource = tree.read(indexFilePath)!.toString('utf-8');
      const indexSourceFile = createSourceFile(indexFilePath, indexSource, ScriptTarget.Latest, true);

      insert(tree, indexFilePath, [...addGlobal(indexSourceFile, indexFilePath, `export * from './${options.name.toLowerCase()}';`, true)]);
      return tree;
    };
  }

  export function getTemplateOptions(options: Schema, platform: string, framework?: FrameworkTypes) {
    const nameParts = options.name.split('-');
    let endingDashName = nameParts[0];
    if (nameParts.length > 1) {
      endingDashName = stringUtils.capitalize(nameParts[nameParts.length - 1]);
    }
    const libFolderName = PluginHelpers.getLibFoldername(<PlatformTypes>platform, framework);
    return {
      ...(options as any),
      ...getDefaultTemplateOptions(),
      name: options.name.toLowerCase(),
      endingDashName,
      libFolderName,
    };
  }

  export function getMoveTo(options: Schema, platform: string, projectName?: string, framework?: FrameworkTypes) {
    // console.log('getMoveTo framework:', framework);
    const libFolderName = PluginHelpers.getLibFoldername(<PlatformTypes>platform, framework);
    // console.log('getMoveTo libFolderName:', libFolderName);
    const featureName = options.name.toLowerCase();
    let moveTo = `libs/${isXplatWorkspace() ? 'xplat/' : ''}${libFolderName}/features/${featureName}`;
    if (projectName) {
      let appDir = ['web', 'web-angular'].includes(libFolderName) ? '/app' : '';
      moveTo = `apps/${projectName}/src${appDir}/features/${featureName}`;
      // console.log('moveTo:', moveTo);
    }
    return moveTo;
  }
}
