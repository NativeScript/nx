import { ExecutorContext, convertNxExecutor } from '@nrwl/devkit';
import * as childProcess from 'child_process';
import { TestBuilderSchema } from './schema';

export function runBuilder(options: TestBuilderSchema, context: ExecutorContext): Promise<{ success: boolean }> {
  return new Promise((resolve, reject) => {
    const projectConfig = context.workspace.projects[context.projectName];
    // console.log('context.projectName:', context.projectName);
    const projectCwd = projectConfig.root;
    // console.log('projectCwd:', projectCwd);
    // console.log('context.targetName:', context.targetName);
    // console.log('context.configurationName:', context.configurationName);
    // console.log('context.target.options:', context.target.options);

    let targetConfigName = '';
    if (context.configurationName && context.configurationName !== 'build') {
      targetConfigName = context.configurationName;
    }

    // determine if any trailing args that need to be added to run/build command
    const configTarget = targetConfigName ? `:${targetConfigName}` : '';
    const projectTargetCmd = `${context.projectName}:${context.targetName}${configTarget}`;
    const projectTargetCmdIndex = process.argv.findIndex((c) => c === projectTargetCmd);
    // const additionalCliFlagArgs = [];
    // if (process.argv.length > projectTargetCmdIndex+1) {
    //   additionalCliFlagArgs.push(...process.argv.slice(projectTargetCmdIndex+1, process.argv.length));
    //   // console.log('additionalCliFlagArgs:', additionalCliFlagArgs);
    // }

    const throwPlatformError = () => {
      throw new Error(`Configuration must exist for 'ios' or 'android' or options.platform should be set for this target.`);
    }

    const nsOptions = ['test'];

    const fileReplacements: Array<string> = [];
    let configOptions;
    if (context.target.configurations) {
      configOptions = context.target.configurations[targetConfigName];
      // console.log('configOptions:', configOptions)

      if (configOptions) {
        if (['ios', 'android'].includes(targetConfigName)) {
          nsOptions.push(targetConfigName);
        } else if (options.platform) {
          nsOptions.push(options.platform);
        } else {
          throwPlatformError();
        }
        if (configOptions.coverage) {
          nsOptions.push('--env.codeCoverage');
        }
        if (configOptions.fileReplacements) {
          for (const r of configOptions.fileReplacements) {
            fileReplacements.push(`${r.replace.replace(projectCwd, './')}:${r.with.replace(projectCwd, './')}`);
          }
        }
      }
    }

    const hasPlatform = nsOptions.filter(o => ['ios', 'android'].includes(o)).length > 0;
    if (!hasPlatform) {
      throwPlatformError();
    }

    if (options.coverage && !nsOptions.includes('--env.codeCoverage')) {
      // allow target override for all configurations
      nsOptions.push('--env.codeCoverage');
    }

    if (options.device) {
      nsOptions.push('--device');
      nsOptions.push(options.device);
    }

    if (fileReplacements.length) {
      // console.log('fileReplacements:', fileReplacements);
      nsOptions.push('--env.replace');
      nsOptions.push(fileReplacements.join(','));
    }
    // always add --force (unless explicity set to false) for now since within Nx we use @nativescript/webpack at root only and the {N} cli shows a blocking error if not within the app
    if (options?.force !== false) {
      nsOptions.push('--force');
    }

    // additional args after -- should be passed through
    const argSeparator = process.argv.findIndex((arg) => arg === '--');
    let additionalArgs = [];
    if (argSeparator >= 0) {
      additionalArgs = process.argv.slice(argSeparator + 1);
    }

    console.log('---');
    console.log(`Running NativeScript unit tests within ${projectCwd}`);
    console.log(' ');
    console.log([`ns`, ...nsOptions, ...additionalArgs].join(' '));
    console.log('---');
    // console.log('command:', [`ns`, ...nsOptions].join(' '));
    const child = childProcess.spawn(/^win/.test(process.platform) ? 'ns.cmd' : 'ns', [...nsOptions, ...additionalArgs], {
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
