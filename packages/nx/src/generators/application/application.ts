import {
  Tree,
  addProjectConfiguration,
  generateFiles,
  joinPathFragments,
  ProjectConfiguration,
  runTasksInSerial,
  GeneratorCallback,
  offsetFromRoot,
  formatFiles,
} from '@nx/devkit';
import { initGenerator } from '@nx/js';
import {
  getBaseName,
  getAppNamingConvention,
  getDefaultTemplateOptions,
  getFrontendFramework,
  missingArgument,
  preRun,
  updatePluginDependencies,
  updatePluginSettings,
} from '../../utils';
import {
  angularVersion,
  nsAngularVersion,
  nsWebpackVersion,
  nsNgToolsVersion,
  nsCoreVersion,
  typescriptVersion,
  rxjsVersion,
  zonejsVersion,
  nsIOSRuntimeVersion,
  nsAndroidRuntimeVersion,
} from '../../utils/versions';
import { appResources } from '../app-resources/app-resources';
import { assertNotUsingTsSolutionSetup } from '@nx/js/src/utils/typescript/ts-solution-setup';
import { normalizeOptions } from './normalized-options';
import { NormalizedSchema } from './normalized-schema';
import { addBuildTargetDefaults } from '@nx/devkit/src/generators/target-defaults-utils';
import { logShowProjectCommand } from '@nx/devkit/src/utils/log-show-project-command';
import { ApplicationSchema } from './schema';

export async function applicationGenerator(tree: Tree, options: NormalizedSchema) {
  assertNotUsingTsSolutionSetup(tree, 'nativescript', 'application');
  if (!options.directory) {
    throw new Error(missingArgument('name', 'Provide a directory for your NativeScript app.', 'nx g @nativescript/nx:app <directory>'));
  }
  const commonOptions = preRun(tree, options, true);
  options = { ...options, ...getAppNamingConvention(options, 'nativescript') };

  options = await normalizeOptions(tree, options);

  const tasks: GeneratorCallback[] = [];

  tasks.push(
    await initGenerator(tree, {
      skipFormat: true,
    })
  );

  addBuildTargetDefaults(tree, options.buildExecutor);
  addProjectConfiguration(tree, options.name, getAppProjectConfiguration(options));

  createAppFiles(tree, options);
  // add extra files per options
  if (options.routing && ['angular'].includes(options.framework)) {
    createAppFiles(tree, options, 'routing');
  }
  // add app resources
  appResources(tree, {
    path: options.projectRoot,
  });

  updatePluginSettings(tree, options);
  tasks.push(updatePluginDependencies(tree, options));

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  tasks.push(() => logShowProjectCommand(options.name));

  return runTasksInSerial(...tasks);
}

function getFrontendFrameworkTargets(options: NormalizedSchema) {
  switch (options.framework) {
    case 'angular':
      return {
        build: {
          executor: options.buildExecutor,
          options: {
            noHmr: true,
            production: true,
            uglify: true,
            release: true,
            forDevice: true,
          },
          configurations: {
            prod: {
              fileReplacements: [
                {
                  replace: `./src/environments/environment.ts`,
                  with: `./src/environments/environment.prod.ts`,
                },
              ],
            },
          },
        },
      };
    default:
      return {};
  }
}

function getAppProjectConfiguration(options: NormalizedSchema): ProjectConfiguration {
  return {
    root: options.projectRoot,
    sourceRoot: options.projectSourceRoot,
    projectType: 'application',
    targets: {
      ...getFrontendFrameworkTargets(options),
      ios: {
        executor: options.buildExecutor,
        options: {
          platform: 'ios',
        },
        configurations: {
          build: {
            copyTo: './dist/build.ipa',
          },
          prod: {
            combineWithConfig: 'build:prod',
          },
        },
      },
      android: {
        executor: options.buildExecutor,
        options: {
          platform: 'android',
        },
        configurations: {
          build: {
            copyTo: './dist/build.apk',
          },
          prod: {
            combineWithConfig: 'build:prod',
          },
        },
      },
      clean: {
        executor: options.buildExecutor,
        options: {
          clean: true,
        },
      },
      lint: {
        executor: options.lintExecutor,
      },
    },
  };
}

function createAppFiles(tree: Tree, options: ApplicationSchema & Partial<NormalizedSchema>, extra: string = '') {
  const framework = options.framework || getFrontendFramework() || 'angular';
  if (typeof options.routing === 'undefined') {
    // ensure it's at least defined
    options.routing = false;
  }
  generateFiles(tree, joinPathFragments(__dirname, `files${framework ? '_' + framework : ''}${extra ? '_' + extra : ''}`), options.projectRoot, {
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

export default applicationGenerator;
