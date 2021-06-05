import { ExecutorContext, convertNxExecutor } from '@nrwl/devkit';
import * as childProcess from 'child_process';
import { BuildBuilderSchema } from './schema';

export function runBuilder(options: BuildBuilderSchema, context: ExecutorContext): Promise<{ success: boolean }> {
  return new Promise((resolve, reject) => {
    const projectConfig = context.workspace.projects[context.projectName];
    // determine if running or building only
    const isBuild = process.argv.find((a) => a === 'build');
    if (isBuild) {
      // allow build options to override run target options
      const buildTarget = projectConfig.targets['build'];
      if (buildTarget && buildTarget.options) {
        options = {
          ...options,
          ...buildTarget.options
        };
      }
    }
    // console.log('context.projectName:', context.projectName);
    const projectCwd = projectConfig.root;
    // console.log('projectCwd:', projectCwd);
    // console.log('context.targetName:', context.targetName);
    // console.log('context.configurationName:', context.configurationName);
    // console.log('context.target.options:', context.target.options);

    // determine if any trailing args that need to be added to run/build command
    const configTarget = context.configurationName ? `:${context.configurationName}` : '';
    const projectTargetCmd = `${context.projectName}:${context.targetName}${configTarget}`;
    const projectTargetCmdIndex = process.argv.findIndex(c => c === projectTargetCmd);
    const additionalCliFlagArgs = [];
    if (process.argv.length > projectTargetCmdIndex+1) {
      additionalCliFlagArgs.push(...process.argv.slice(projectTargetCmdIndex+1, process.argv.length));
      // console.log('additionalCliFlagArgs:', additionalCliFlagArgs);
    }

    const fileReplacements: Array<string> = [];
    let configOptions;
    if (context.target.configurations) {
      configOptions = context.target.configurations[context.configurationName];
      // console.log('configOptions:', configOptions)

      if (configOptions) {
        if (configOptions.fileReplacements) {
          for (const r of configOptions.fileReplacements) {
            fileReplacements.push(`${r.replace.replace(projectCwd, './')}:${r.with.replace(projectCwd, './')}`);
          }
        }
        if (configOptions.combineWithConfig) {
          const configParts = configOptions.combineWithConfig.split(':');
          const combineWithTargetName = configParts[0];
          const combineWithTarget = projectConfig.targets[combineWithTargetName];
          if (combineWithTarget && combineWithTarget.configurations) {
            if (configParts.length > 1) {
              const configName = configParts[1];
              const combineWithTargetConfig = combineWithTarget.configurations[configName];
              // TODO: combine configOptions with combineWithConfigOptions
              if (combineWithTargetConfig) {
                if (combineWithTargetConfig.fileReplacements) {
                  for (const r of combineWithTargetConfig.fileReplacements) {
                    fileReplacements.push(`${r.replace.replace(projectCwd, './')}:${r.with.replace(projectCwd, './')}`);
                  }
                }
              }
            }
          } else {
            console.warn(`Warning: No configurations will be combined. "${combineWithTargetName}" was not found for project name: "${context.projectName}"`);
          }
        }
      }
    }

    const nsOptions = [];
    if (options.clean) {
      nsOptions.push('clean');
    } else {
      if (isBuild) {
        nsOptions.push('build');
      } else {
        if (options.debug === false) {
          nsOptions.push('run');
        } else {
          // default to debug mode
          nsOptions.push('debug');
        }
      }
      // always add --force for now since within Nx we use @nativescript/webpack at root only and the {N} cli shows a blocking error if not within the app
      nsOptions.push('--force');

      if (options.platform) {
        nsOptions.push(options.platform);
      }
      if (options.device && !options.emulator) {
        nsOptions.push('--device');
        nsOptions.push(options.device);
      }
      if (options.emulator) {
        nsOptions.push('--emulator');
      }
      if (options.noHmr) {
        nsOptions.push('--no-hmr');
      }
      if (options.uglify) {
        nsOptions.push('--env.uglify');
      }
      if (options.verbose) {
        nsOptions.push('--env.verbose');
      }
      if (options.production) {
        nsOptions.push('--env.production');
      }
      if (options.forDevice) {
        nsOptions.push('--for-device');
      }
      if (options.release) {
        nsOptions.push('--release');
      }
      if (fileReplacements.length) {
        // console.log('fileReplacements:', fileReplacements);
        nsOptions.push('--env.replace');
        nsOptions.push(fileReplacements.join(','));
      }
    }
    const child = childProcess.spawn(/^win/.test(process.platform) ? 'ns.cmd' : 'ns', [...nsOptions, ...additionalCliFlagArgs], {
      cwd: projectCwd,
      stdio: 'inherit',
    });
    child.on('close', (code) => {
      console.log(`Done.`);
      resolve({ success: code === 0 });
    });
  });
}

export default convertNxExecutor(runBuilder);
