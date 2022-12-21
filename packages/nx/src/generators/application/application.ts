import { Tree, addProjectConfiguration, generateFiles, joinPathFragments, installPackagesTask } from '@nrwl/devkit';
import { getAppName, getDefaultTemplateOptions, getFrontendFramework, getPrefix, missingArgument, PluginHelpers, prerun, updateNxProjects, updatePackageScripts } from '../../utils';
import { angularVersion, nsAngularVersion, nsWebpackVersion, nsNgToolsVersion, nsCoreVersion, typescriptVersion, rxjsVersion, zonejsVersion, nsIOSRuntimeVersion, nsAndroidRuntimeVersion } from '../../utils/versions';
import { appResources } from '../app-resources/app-resources';
import { Schema } from './schema';

export async function applicationGenerator(tree: Tree, options: Schema) {
  if (!options.name) {
    throw new Error(missingArgument('name', 'Provide a name for your NativeScript app.', 'nx g @nativescript/nx:app name'));
  }

  prerun(tree, options, true);
  PluginHelpers.applyAppNamingConvention(tree, options, 'nativescript');
  addAppFiles(tree, options, options.name);
  // add extra files per options
  if (options.routing && ['angular'].includes(options.framework)) {
    addAppFiles(tree, options, options.name, 'routing');
  }
  // add app resources
  appResources(tree, {
    path: `apps/${options.directory ? options.directory + '/' : ''}${options.name}`,
  });
  PluginHelpers.updateRootDeps(tree, options);
  // PluginHelpers.updatePrettierIgnore(),
  // PluginHelpers.addPackageInstallTask(tree, options);

  const directory = options.directory ? `${options.directory}/` : '';
  const appPath = `apps/${directory}${options.name}`;
  let frontendFrameworkConfig: any = {};
  switch (options.framework) {
    case 'angular':
      frontendFrameworkConfig = {
        build: {
          executor: '@nativescript/nx:build',
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
      break;
  }
  addProjectConfiguration(tree, options.name, {
    root: `${appPath}/`,
    sourceRoot: `${appPath}/src`,
    projectType: 'application',
    targets: {
      ...frontendFrameworkConfig,
      ios: {
        executor: '@nativescript/nx:build',
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
        executor: '@nativescript/nx:build',
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
        executor: '@nativescript/nx:build',
        options: {
          clean: true,
        },
      },
      lint: {
        executor: '@nrwl/linter:eslint',
        options: {
          lintFilePatterns: [`${appPath}/**/*.ts`, `${appPath}/src/**/*.html`],
        },
      },
    },
  });

  return () => {
    installPackagesTask(tree);
  }
}

function addAppFiles(tree: Tree, options: Schema, appName: string, extra: string = '') {
  const appname = getAppName(options, 'nativescript');
  const directory = options.directory ? `${options.directory}/` : '';
  const framework = options.framework || getFrontendFramework() || 'angular';
  if (typeof options.routing === 'undefined') {
    // ensure it's at least defined
    options.routing = false;
  }
  generateFiles(tree, joinPathFragments(__dirname, `files${framework ? '_' + framework : ''}${extra ? '_' + extra : ''}`), `apps/${directory}${appName}`, {
    ...(options as any),
    ...getDefaultTemplateOptions(),
    appname,
    directoryAppPath: `${directory}${options.name}`,
    pathOffset: directory ? '../../../' : '../../',
    libFolderName: PluginHelpers.getLibFoldername('nativescript'),
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
