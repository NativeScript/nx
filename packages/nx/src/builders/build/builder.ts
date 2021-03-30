import { ExecutorContext, convertNxExecutor } from '@nrwl/devkit';
import * as childProcess from 'child_process';
import { BuildBuilderSchema } from './schema';

export function runBuilder(options: BuildBuilderSchema, context: ExecutorContext): Promise<{ success: boolean }> {
  return new Promise((resolve, reject) => {
    // console.log('context.projectName:', context.projectName);
    const projectCwd = context.workspace.projects[context.projectName].root;
    // console.log('projectCwd:', projectCwd);
    // console.log('context.targetName:', context.targetName);
    // console.log('context.configurationName:', context.configurationName);
    // console.log('context.target.options:', context.target.options);
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
          const combineWithTarget = context.workspace.projects[context.projectName].targets[combineWithTargetName];
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
      if (options.debug === false) {
        nsOptions.push('run');
      } else {
        // default to debug mode
        nsOptions.push('debug');
      }
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
    const child = childProcess.spawn('ns', nsOptions, {
      cwd: projectCwd,
      stdio: 'inherit'
    });
    child.on('close', (code) => {
      console.log(`Done.`);
      resolve({ success: code === 0 });
    });
  });
}

export default convertNxExecutor(runBuilder);
