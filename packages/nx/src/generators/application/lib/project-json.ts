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
