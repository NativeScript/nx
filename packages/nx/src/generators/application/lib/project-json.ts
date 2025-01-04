import { NormalizedSchema } from '../schema';
import { ProjectConfiguration } from '@nx/devkit';

export function getFrontendFrameworkTargets(options: NormalizedSchema) {
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
          dependsOn: ['^build'],
        },
      };
    default:
      return {};
  }
}

export function getProjectConfiguration(options: NormalizedSchema): ProjectConfiguration {
  return {
    root: options.projectRoot,
    sourceRoot: options.projectSourceRoot,
    projectType: 'application',
    targets: {
      ...getFrontendFrameworkTargets(options),
      debug: {
        executor: '@nativescript/nx:debug',
        options: {
          noHmr: true,
          uglify: false,
          release: false,
          forDevice: false,
          prepare: false,
        },
        configurations: {
          build: {
            copyTo: './dist/build.ipa',
          },
          prod: {
            fileReplacements: [
              {
                replace: `./src/environments/environment.ts`,
                with: `./src/environments/environment.prod.ts`,
              },
            ],
          },
        },
        dependsOn: ['^build'],
      },
      prepare: {
        executor: '@nativescript/nx:prepare',
        options: {
          noHmr: true,
          production: true,
          uglify: true,
          release: true,
          forDevice: true,
          prepare: true,
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
        dependsOn: ['^build'],
      },
      clean: {
        executor: '@nativescript/nx:clean',
        options: {},
      },
    },
  };
}
