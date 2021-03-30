import { apply, branchAndMerge, chain, externalSchematic, mergeWith, move, noop, Rule, SchematicContext, SchematicsException, template, Tree, url } from '@angular-devkit/schematics';
import { updateWorkspace } from '@nrwl/workspace';
import { getAppName, getDefaultTemplateOptions, getFrontendFramework, getPrefix, missingArgument, PluginHelpers, prerun, updateNxProjects, updatePackageScripts } from '../../utils';
import { nsWebpackVersion, nsNgToolsVersion, nsCoreVersion } from '../../utils/versions';
import { Schema } from './schema';

export default function (options: Schema) {
  if (!options.name) {
    throw new SchematicsException(missingArgument('name', 'Provide a name for your NativeScript app.', 'nx g @nativescript/nx:app name'));
  }

  return chain([
    prerun(options, true),
    PluginHelpers.applyAppNamingConvention(options, 'nativescript'),
    (tree: Tree, context: SchematicContext) => addAppFiles(options, options.name),
    // add extra files per options
    (tree: Tree, context: SchematicContext) => (options.routing && ['angular'].includes(options.framework) ? addAppFiles(options, options.name, 'routing') : noop()),
    // add app resources
    (tree: Tree, context: SchematicContext) =>
      externalSchematic(
        '@nativescript/nx',
        'app-resources',
        {
          path: `apps/${options.directory ? options.directory + '/' : ''}${options.name}`,
        },
        { interactive: false }
      )(tree, context),
    PluginHelpers.updateRootDeps(options),
    // PluginHelpers.updatePrettierIgnore(),
    PluginHelpers.addPackageInstallTask(options),
    (tree: Tree, context: SchematicContext) => {
      const directory = options.directory ? `${options.directory}/` : '';
      const appPath = `apps/${directory}${options.name}`;
      let frontendFrameworkConfig: any = {};
      switch (options.framework) {
        case 'angular':
          frontendFrameworkConfig = {
            build: {
              builder: '@nativescript/nx:build',
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
                      replace: `${appPath}/src/environments/environment.ts`,
                      with: `${appPath}/src/environments/environment.prod.ts`,
                    },
                  ],
                },
              },
            },
          };
          break;
      }
      return updateWorkspace((workspace) => {
        workspace.projects.add({
          name: `${options.name}`,
          root: `${appPath}/`,
          sourceRoot: `${appPath}/src`,
          projectType: 'application',
          prefix: getPrefix(),
          targets: {
            ...frontendFrameworkConfig,
            ios: {
              builder: '@nativescript/nx:build',
              options: {
                platform: 'ios',
              },
              configurations: {
                prod: {
                  combineWithConfig: 'build:prod',
                },
              },
            },
            android: {
              builder: '@nativescript/nx:build',
              options: {
                platform: 'ios',
              },
              configurations: {
                prod: {
                  combineWithConfig: 'build:prod',
                },
              },
            },
            clean: {
              builder: '@nativescript/nx:build',
              options: {
                clean: true,
              },
            },
            lint: {
              builder: '@nrwl/linter:eslint',
              options: {
                lintFilePatterns: [`${appPath}/**/*.ts`, `${appPath}/src/**/*.html`],
              },
            },
            test: {
              builder: '@nrwl/jest:jest',
              options: {
                jestConfig: `${appPath}/jest.config.js`,
                tsConfig: `${appPath}/tsconfig.spec.json`,
                passWithNoTests: true,
                setupFile: `${appPath}/src/test-setup.ts`,
              },
            },
          },
        });
      });
    },
    (tree: Tree) => {
      const projects = {};
      projects[`${options.name}`] = {
        tags: options.tags ? options.tags.split(',') : [],
      };
      return updateNxProjects(tree, projects);
    },
  ]);
}

function addAppFiles(options: Schema, appName: string, extra: string = ''): Rule {
  const appname = getAppName(options, 'nativescript');
  const directory = options.directory ? `${options.directory}/` : '';
  const framework = options.framework || getFrontendFramework();
  return branchAndMerge(
    mergeWith(
      apply(url(`./files${framework ? '_' + framework : ''}${extra ? '_' + extra : ''}`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions(),
          appname,
          pathOffset: directory ? '../../../' : '../../',
          libFolderName: PluginHelpers.getLibFoldername('nativescript'),
          nsCoreVersion,
          nsWebpackVersion,
          nsNgToolsVersion,
        }),
        move(`apps/${directory}${appName}`),
      ])
    )
  );
}
