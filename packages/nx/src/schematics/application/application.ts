import { apply, branchAndMerge, chain, externalSchematic, mergeWith, move, noop, Rule, SchematicContext, SchematicsException, template, Tree, url } from '@angular-devkit/schematics';
import { addDepsToPackageJson } from '@nrwl/workspace';
import { getAppName, getDefaultTemplateOptions, getFrontendFramework, getPrefix, missingArgument, PluginHelpers, prerun, updateNxProjects, updatePackageScripts, updateWorkspace } from '../../utils';
import { nsAngularVersion, nsRxjs, nsWebpackVersion, nsZonejs } from '../../utils/versions';
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
    addAngularDependencies(),
    PluginHelpers.updateRootDeps(options),
    // PluginHelpers.updatePrettierIgnore(),
    PluginHelpers.addPackageInstallTask(options),
    (tree: Tree) => {
      const scripts = {};
      scripts[`clean`] = `npx rimraf hooks node_modules package-lock.json && npm i`;
      return updatePackageScripts(tree, scripts);
    },
    (tree: Tree, context: SchematicContext) => {
      const directory = options.directory ? `${options.directory}/` : '';
      const appPath = `apps/${directory}${options.name}`;
      let frontendFrameworkConfig: any = {};
      switch (options.framework) {
        case 'angular':
          frontendFrameworkConfig = {
            default: {
              builder: '@nrwl/workspace:run-commands',
              configurations: {
                production: {
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
      const projects = {};
      projects[`${options.name}`] = {
        root: `${appPath}/`,
        sourceRoot: `${appPath}/src`,
        projectType: 'application',
        prefix: getPrefix(),
        architect: {
          ...frontendFrameworkConfig,
          ios: {
            builder: '@nrwl/workspace:run-commands',
            options: {
              commands: [`ns debug ios --no-hmr --env.configuration={args.configuration} --env.projectName=${options.name}`],
              cwd: appPath,
              parallel: false,
            },
          },
          android: {
            builder: '@nrwl/workspace:run-commands',
            options: {
              commands: [`ns debug android --no-hmr --env.configuration={args.configuration} --env.projectName=${options.name}`],
              cwd: appPath,
              parallel: false,
            },
          },
          clean: {
            builder: '@nrwl/workspace:run-commands',
            options: {
              commands: ['ns clean', 'npm i', 'npx rimraf package-lock.json'],
              cwd: appPath,
              parallel: false,
            },
          },
          lint: {
            builder: '@nrwl/linter:eslint',
            options: {
              lintFilePatterns: [`${appPath}/**/*.ts`],
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
      };
      return updateWorkspace({ projects })(tree, <any>context);
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

export function addAngularDependencies(): Rule {
  return addDepsToPackageJson(
    {
      '@angular/animations': nsAngularVersion,
      '@angular/common': nsAngularVersion,
      '@angular/compiler': nsAngularVersion,
      '@angular/core': nsAngularVersion,
      '@angular/forms': nsAngularVersion,
      '@angular/platform-browser': nsAngularVersion,
      '@angular/platform-browser-dynamic': nsAngularVersion,
      '@angular/router': nsAngularVersion,
      '@nativescript/angular': nsAngularVersion,
      rxjs: nsRxjs,
      'zone.js': nsZonejs,
    },
    {}
  );
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
          nsWebpackVersion,
        }),
        move(`apps/${directory}${appName}`),
      ])
    )
  );
}
