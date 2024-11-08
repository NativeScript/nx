import { ExecutorContext } from '@nx/devkit';
import childProcess from 'child_process';
import { prompt } from 'enquirer';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync } from 'fs-extra';
import { resolve as nodeResolve } from 'path';
import { build, parse } from 'plist';
import { Platform } from '../schemas/base.schema';
import { mergeDeep } from '../schemas/deep-merge';
import { COMMANDS } from './commands';
import { ExecutorSchema } from './types';
import { quoteString } from './helpers';

export function commonExecutor(options: ExecutorSchema, context: ExecutorContext): Promise<{ success: boolean }> {
  // global vars
  const isWindows = process.platform === 'win32';
  let projectCwd: string;

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const isBuild = options.command === COMMANDS.BUILD;
      const isClean = options.command === COMMANDS.CLEAN;
      const isDebug = options.command === COMMANDS.DEBUG;
      const isPrepare = options.command === COMMANDS.PREPARE;
      const isRun = options.command === COMMANDS.RUN;
      const isTest = options.command === COMMANDS.TEST;
      const isSilent = options.silent === true;

      const platformCheck = [context.configurationName, options.platform].concat(options?.['_']);
      let isIos = platformCheck.some((overrides) => overrides === 'ios');
      let isAndroid = platformCheck.some((overrides) => overrides === 'android');
      let isVision = platformCheck.some((overrides) => overrides === 'vision' || overrides === 'visionos');

      if (!isClean && !isSilent && !isIos && !isAndroid && !isVision) {
        const platform = await selectPlatform(options);
        isIos = platform === 'ios';
        isAndroid = platform === 'android';
        isVision = platform === 'visionos';
      }

      if (!isClean) {
        options.platform = isAndroid ? 'android' : isIos ? 'ios' : 'visionos';
      }

      const projectConfig = context.projectsConfigurations.projects[context.projectName];
      projectCwd = projectConfig.root;

      const target = projectConfig.targets[options.command];
      const targetOptions = target.options;
      const targetPlatformOptions = targetOptions[options.platform];
      // const targetDescription = JSON.parse(process.argv.find((arg) => arg.indexOf('targetDescription') !== -1));

      // fix for nx overwriting android and ios sub properties
      mergeDeep(options, targetOptions);

      const configurationName = await selectConfiguration(target.configurations, context.configurationName);
      // fix for nx overwriting android and ios sub properties
      if (configurationName) mergeDeep(options, target.configurations[configurationName]);

      const nsOptions = prepareNsOptions(options, projectCwd);
      const additionalArgs: string[] = []; // Assuming any extra flags are handled here
      if (options.flags) {
        // persisted flags in configurations
        additionalArgs.push(...options.flags.split(' '));
      }

      if (options.android?.xmlUpdates) updateXml(options.android.xmlUpdates, 'android');
      if (options.ios?.plistUpdates) updateXml(options.ios.plistUpdates, 'ios');

      await checkOptions();

      const result = await runCommand(nsOptions, additionalArgs);
      resolve(result);
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });

  async function selectPlatform(options: ExecutorSchema): Promise<Platform> {
    if (options.platform) return options.platform;

    if (options.silent) {
      console.warn('No platform was specified. Defaulting to iOS.');
      return 'ios';
    }

    const platformChoices: Platform[] = ['ios', 'android', 'visionos'];
    const { platform } = await prompt<{ platform: Platform }>({
      type: 'select',
      name: 'platform',
      message: 'Which platform do you want to target?',
      choices: platformChoices,
    });
    return platform;
  }

  async function selectConfiguration(targetConfigurations: any, configurationName: string) {
    if (!configurationName && targetConfigurations && Object.keys(targetConfigurations).length) {
      const { configurationName: selectedConfig } = await prompt<{ configurationName: string }>({
        type: 'select',
        name: 'configurationName',
        message: 'No configuration was provided. Did you mean to select one of these configurations?',
        choices: ['No', ...Object.keys(targetConfigurations)],
      });
      if (selectedConfig == 'No') {
        console.warn(`Continuing with no configuration. Specify with --configuration=prod, -c=prod, or :prod`);
      }
      return selectedConfig !== 'No' ? selectedConfig : undefined;
    }
    return configurationName;
  }

  function prepareNsOptions(options: ExecutorSchema, projectCwd: string) {
    const nsOptions: string[] = [];
    if (options.platform === 'visionos') {
      // visionos does not support debug with chrome devtools yet
      nsOptions.push('run');
    } else {
      nsOptions.push(options.command);
    }

    // early exit for `ns clean`
    if (options.command === COMMANDS.CLEAN) return nsOptions;

    if (options.platform === 'android') {
      if (options.android?.aab || options.aab) {
        nsOptions.push('--aab');
      }
      if (options.android?.keyStorePath || options.keyStorePath) {
        nsOptions.push(`--key-store-path=${options.android?.keyStorePath || options.keyStorePath}`);
      }
      if (options.android?.keyStorePassword || options.keyStorePassword) {
        nsOptions.push(`--key-store-password=${options.android?.keyStorePassword || options.keyStorePassword}`);
      }
      if (options.android?.keyStoreAlias || options.keyStoreAlias) {
        nsOptions.push(`--key-store-alias=${options.android?.keyStoreAlias || options.keyStoreAlias}`);
      }
      if (options.android?.keyStoreAliasPassword || options.keyStoreAliasPassword) {
        nsOptions.push(`--key-store-alias-password=${options.android?.keyStoreAliasPassword || options.keyStoreAliasPassword}`);
      }
    }

    if (options.platform === 'ios') {
      if (options.ios?.provision) {
        nsOptions.push(`--provision=${options.ios.provision}`);
      } else if (options.provision) {
        nsOptions.push(`--provision=${options.provision}`);
      }
    }

    // Append common options
    options.platform && nsOptions.push(options.platform);
    options.clean && nsOptions.push('--clean');
    options.coverage && nsOptions.push('--env.codeCoverage');
    options.device && !options.emulator && nsOptions.push(`--device=${options.device}`);
    options.emulator && nsOptions.push('--emulator');
    options.noHmr && nsOptions.push('--no-hmr');
    options.timeout && options.timeout > -1 && nsOptions.push(`--timeout=${options.timeout}`);
    options.uglify && nsOptions.push('--env.uglify');
    options.verbose && nsOptions.push('--env.verbose');
    options.production && nsOptions.push('--env.production');
    options.forDevice && nsOptions.push('--for-device');
    options.release && nsOptions.push('--release');
    options.copyTo && nsOptions.push(`--copy-to=${options.copyTo}`);
    options.force !== false && nsOptions.push('--force');

    const nsFileReplacements: Array<string> = [];
    for (const fileReplacement of options.fileReplacements) {
      nsFileReplacements.push(`${fileReplacement.replace.replace(projectCwd, './')}:${fileReplacement.with.replace(projectCwd, './')}`);
    }
    nsFileReplacements.length && nsOptions.push(`--env.replace="${nsFileReplacements.join(',')}"`);

    return nsOptions;
  }

  function updateXml(xmlUpdatesConfig: Record<string, any>, type: Platform) {
    const xmlUpdatesKeys = Object.keys(xmlUpdatesConfig || {});
    for (const filePathKeys of xmlUpdatesKeys) {
      let xmlFilePath: string;
      if (filePathKeys.indexOf('.') === 0) {
        // resolve relative to project directory
        xmlFilePath = nodeResolve(projectCwd, filePathKeys);
      } else {
        // default to locating in App_Resources
        let defaultDir: string[];
        if (type === 'ios') {
          defaultDir = ['App_Resources', 'iOS'];
        } else if (type === 'visionos') {
          defaultDir = ['App_Resources', 'visionOS'];
        } else if (type === 'android') {
          defaultDir = ['App_Resources', 'Android'];
        }
        xmlFilePath = nodeResolve(projectCwd, ...defaultDir, filePathKeys);
      }

      let xmlFileContent: any;
      const fileContent = readFileSync(xmlFilePath, 'utf8');
      const xmlUpdates = xmlUpdatesConfig[filePathKeys];

      if (type === 'ios' || type === 'visionos') {
        xmlFileContent = parse(fileContent);
      } else if (type === 'android') {
        const parser = new XMLParser({
          ignoreAttributes: false,
          ignoreDeclaration: false,
          ignorePiTags: false,
          attributeNamePrefix: '',
          allowBooleanAttributes: true,
        });
        xmlFileContent = parser.parse(fileContent);
      }

      let needsUpdate = false;

      const recursiveUpdate = function (target: any, updates: any): void {
        for (const key in updates) {
          if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
            if (!target[key]) {
              target[key] = {};
            }
            recursiveUpdate(target[key], updates[key]);
          } else {
            if (Array.isArray(target[key])) {
              recursiveUpdate(target[key], updates[key]);
            } else {
              target[key] = updates[key];
              needsUpdate = true;
            }
          }
        }
      };
      recursiveUpdate(xmlFileContent, xmlUpdates);

      if (needsUpdate) {
        let newXmlFileContent;
        if (type === 'ios' || type === 'visionos') {
          newXmlFileContent = build(xmlFileContent, { pretty: true, indent: '\t' });
        } else if (type === 'android') {
          const builder = new XMLBuilder({
            ignoreAttributes: false,
            format: true,
            suppressEmptyNode: true,
            attributeNamePrefix: '',
            suppressBooleanAttributes: false,
          });
          newXmlFileContent = builder.build(xmlFileContent);
        }
        writeFileSync(xmlFilePath, newXmlFileContent);
        console.log(`Updated: ${xmlFilePath}`);
      }
    }
  }

  async function checkOptions() {
    if (!options.id) return;
    const id = await checkAppId();
    if (options.id !== id) {
      return new Promise<void>((resolve) => {
        let args = ['config', 'set', `${options.platform}.id`, options.id];
        if (isWindows) {
          args = args.map((arg) => quoteString(arg));
        }
        const child = childProcess.spawn(isWindows ? 'ns.cmd' : 'ns', args, {
          cwd: projectCwd,
          stdio: 'inherit',
          shell: isWindows ? true : undefined,
        });
        child.on('close', (code) => {
          child.kill('SIGKILL');
          resolve();
        });
      });
    }
  }

  async function checkAppId(): Promise<string> {
    return new Promise((resolve) => {
      let args = ['config', 'get', `id`];
      if (isWindows) {
        args = args.map((arg) => quoteString(arg));
      }

      const child = childProcess.spawn(isWindows ? 'ns.cmd' : 'ns', args, {
        cwd: projectCwd,
        shell: isWindows ? true : undefined,
      });
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', function (data) {
        // ensure no newline chars at the end
        const appId: string = (data || '').toString().replace('\n', '').replace('\r', '');
        // console.log('existing app id:', appId);
        resolve(appId);
      });
      child.on('close', (code) => {
        child.kill('SIGKILL');
      });
    });
  }

  async function runCommand(nsOptions: any, additionalArgs: string[]): Promise<{ success: boolean }> {
    let icon = '';
    if (!nsOptions.clean) {
      if (nsOptions.platform === 'ios') {
        icon = '';
      } else if (nsOptions.platform === 'android') {
        icon = '🤖';
      } else if (['vision', 'visionos'].includes(nsOptions.platform)) {
        icon = '🥽';
      }
    }
    if (isWindows) {
      // https://github.com/NativeScript/nativescript-cli/pull/5808
      nsOptions = nsOptions.map((arg) => quoteString(arg));
      additionalArgs = additionalArgs.map((arg) => quoteString(arg));
    }

    console.log(`―――――――――――――――――――――――― ${icon}`);
    console.log(`Running NativeScript ${options.command === COMMANDS.TEST ? 'unit tests' : 'CLI'} in ${projectCwd}`);
    console.log(' ');
    console.log([`ns`, ...nsOptions, ...additionalArgs].join(' '));
    console.log(' ');

    if (additionalArgs.length) {
      console.log('Note: When using extra cli flags, ensure all key/value pairs are separated with =, for example: --provision="Name"');
      console.log(' ');
    }
    console.log(`---`);

    return new Promise((resolve) => {
      const child = childProcess.spawn(isWindows ? 'ns.cmd' : 'ns', [...nsOptions, ...additionalArgs], {
        cwd: projectCwd,
        stdio: 'inherit',
        shell: isWindows ? true : undefined,
      });

      child.on('close', (code) => {
        child.kill('SIGKILL');
        resolve({ success: code === 0 });
      });
    });
  }
}
