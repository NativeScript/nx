import { ExecutorContext, readProjectConfiguration } from '@nx/devkit';
import * as childProcess from 'child_process';
import { readFileSync, writeFileSync } from 'fs-extra';
import * as enquirer from 'enquirer';
import { resolve as nodeResolve } from 'path';
import { build, parse } from 'plist';
import { Builder, parseString } from 'xml2js';
import { mergeDeep } from '../schemas/deep-merge';
import { COMMANDS } from './commands';
import { normalizeExtraFlags } from './normalize-extra-flags';
import { parseOptionName } from './parse-option-name';
import { ExecutorSchema } from './types';

export function commonExecutor(options: ExecutorSchema, context: ExecutorContext): Promise<{ success: boolean }> {
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

      const platformCheck = [].concat(context.configurationName, options.platform, options?.['_']);
      let isIos = platformCheck.some((overrides) => overrides === 'ios');
      let isAndroid = platformCheck.some((overrides) => overrides === 'android');

      if (!isClean && !isSilent && !isIos && !isAndroid) {
        const { platform } = <{ platform: string }>await enquirer.default.prompt({
          type: 'select',
          name: 'platform',
          message: 'Which platform do you want to target?',
          choices: [{ name: 'ios' }, { name: 'android' }],
        });
        isIos = platform === 'ios';
        isAndroid = platform === 'android';
      }

      if (!isClean) {
        if (isAndroid) {
          options.platform = 'android';
        } else if (isIos) {
          options.platform = 'ios';
        } else {
          options.platform = 'ios';
          console.warn('No platform was specified. Defaulting to iOS.');
        }
      }

      const projectConfig = context.workspace.projects[context.projectName];
      const projectCwd = projectConfig.root;

      const target = projectConfig.targets[options.command];
      const targetOptions = target.options;
      const targetPlatformOptions = targetOptions[options.platform];
      const targetConfigurations = target.configurations;
      let targetConfigurationName = context.configurationName;
      const targetDescription = JSON.parse(process.argv.find((arg) => arg.indexOf('targetDescription') !== -1));

      // fix for nx overwriting android and ios sub properties
      mergeDeep(options, targetOptions);

      if (!isClean && !isSilent && !targetConfigurationName && targetConfigurations?.length) {
        const { configurationName } = <{ configurationName: string }>await enquirer.default.prompt({
          type: 'select',
          name: 'configurationName',
          message: 'No configuration was provided. Did you mean to select one of these configurations?',
          choices: ['No', ...Object.keys(targetConfigurations)],
        });
        if (configurationName == 'No') {
          console.warn('Continuing with no configuration. Specify configuration with -c/--configuration= or :configuration ');
        } else {
          targetConfigurationName = configurationName;
        }
      }

      // fix for nx overwriting android and ios sub properties
      if (targetConfigurationName) {
        mergeDeep(options, targetConfigurations[targetConfigurationName]);
      }

      const nsOptions = [];
      nsOptions.push(options.command);

      if (!isClean) {
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

        if (isAndroid) {
          options.android.aab && nsOptions.push('--aab');
          options.android.keyStorePath && nsOptions.push(`--key-store-path=${options.android.keyStorePath}`);
          options.android.keyStorePassword && nsOptions.push(`--key-store-password=${options.android.keyStorePassword}`);
          options.android.keyStoreAlias && nsOptions.push(`--key-store-alias=${options.android.keyStoreAlias}`);
          options.android.keyStoreAliasPassword && nsOptions.push(`--key-store-alias-password=${options.android.keyStoreAliasPassword}`);
        }
        if (isIos) {
          options.ios.provision && nsOptions.push(`--provision=${options.ios.provision}`);
        }

        const nsCliFileReplacements: Array<string> = [];
        if (targetConfigurationName) {
          const configOptions = targetConfigurations[targetConfigurationName];
          if (configOptions.combineWithConfig) {
            const configParts = configOptions.combineWithConfig.split(':');
            const combineWithTargetName = configParts[0];
            let configName: string;
            const combineWithTarget = projectConfig.targets[combineWithTargetName];
            if (combineWithTarget && combineWithTarget.configurations) {
              if (configParts.length > 1) {
                configName = configParts[1];
                const combineWithTargetConfig = combineWithTarget.configurations[configName];
                // TODO: combine configOptions with combineWithConfigOptions
                if (combineWithTargetConfig) {
                  if (combineWithTargetConfig.fileReplacements) {
                    for (const r of combineWithTargetConfig.fileReplacements) {
                      nsCliFileReplacements.push(`${r.replace.replace(projectCwd, './')}:${r.with.replace(projectCwd, './')}`);
                    }
                  }
                }
              }
            } else {
              console.warn(`Warning: No configurations will be combined. A "${combineWithTargetName}" target${configName ? ' with configuration "' + configName + '"' : ''} was not found for project name: "${context.projectName}"`);
            }
          }
        }
        for (const r of options?.fileReplacements) {
          nsCliFileReplacements.push(`${r.replace.replace(projectCwd, './')}:${r.with.replace(projectCwd, './')}`);
        }
        nsCliFileReplacements.length && nsOptions.push(`--env.replace="${nsCliFileReplacements.join(',')}"`);
      }

      // some options should never be duplicated
      const enforceSingularOptions = ['provision', 'device', 'copy-to'];

      // additional cli flags
      const overrides = { ...targetDescription.overrides };
      // remove nx unparsed overrides
      for (const override of Object.keys(overrides)) {
        if (override.indexOf('_') === 0) delete overrides[override];
      }
      const additionalArgs = normalizeExtraFlags(overrides);

      if (!isClean) {
        for (const flag of additionalArgs) {
          const optionName = parseOptionName(flag);
          if (!nsOptions.includes(flag) && !additionalArgs.includes(flag) && !enforceSingularOptions.includes(optionName)) {
            additionalArgs.push(flag);
          }
        }
      }

      const runCommand = function () {
        let icon = '';
        if (!options.clean) {
          if (options.platform === 'ios') {
            icon = '';
          } else if (options.platform === 'android') {
            icon = '🤖';
          } else if (['vision', 'visionos'].includes(options.platform)) {
            icon = '🥽';
          }
        }
        console.log(`―――――――――――――――――――――――― ${icon}`);
        console.log(`Running NativeScript ${isTest ? 'unit tests' : 'CLI'} within ${projectCwd}`);
        console.log(' ');
        console.log([`ns`, ...nsOptions, ...additionalArgs].join(' '));
        console.log(' ');
        if (additionalArgs.length) {
          console.log('Note: When using extra cli flags, ensure all key/value pairs are separated with =, for example: --provision="Name"');
          console.log(' ');
        }
        console.log(`---`);
        const child = childProcess.spawn(/^win/.test(process.platform) ? 'ns.cmd' : 'ns', [...nsOptions, ...additionalArgs], {
          cwd: projectCwd,
          stdio: 'inherit',
        });
        child.on('close', (code) => {
          console.log(`Done.`);
          child.kill('SIGKILL');
          resolve({ success: code === 0 });
        });
      };

      const checkAppId = function () {
        return new Promise((resolve) => {
          const child = childProcess.spawn(/^win/.test(process.platform) ? 'ns.cmd' : 'ns', ['config', 'get', `id`], {
            cwd: projectCwd,
          });
          child.stdout.setEncoding('utf8');
          child.stdout.on('data', function (data) {
            // ensure no newline chars at the end
            const appId = (data || '').toString().replace('\n', '').replace('\r', '');
            // console.log('existing app id:', appId);
            resolve(appId);
          });
          child.on('close', (code) => {
            child.kill('SIGKILL');
          });
        });
      };

      const checkOptions = function () {
        if (options.id) {
          // only modify app id if doesn't match (modifying nativescript.config will cause full native build)
          checkAppId().then((id) => {
            if (options.id !== id) {
              // set custom app bundle id before running the app
              const child = childProcess.spawn(/^win/.test(process.platform) ? 'ns.cmd' : 'ns', ['config', 'set', `${options.platform}.id`, options.id], {
                cwd: projectCwd,
                stdio: 'inherit',
              });
              child.on('close', (code) => {
                child.kill('SIGKILL');
                runCommand();
              });
            } else {
              runCommand();
            }
          });
        } else {
          runCommand();
        }
      };

      if (options.clean) {
        runCommand();
      } else {
        const plistKeys = Object.keys(options.ios.plistUpdates || {});
        if (plistKeys.length) {
          for (const filepath of plistKeys) {
            let plistPath: string;
            if (filepath.indexOf('.') === 0) {
              // resolve relative to project directory
              plistPath = nodeResolve(projectCwd, filepath);
            } else {
              // default to locating in App_Resources
              plistPath = nodeResolve(projectCwd, 'App_Resources', 'iOS', filepath);
            }
            const plistFile = parse(readFileSync(plistPath, 'utf8'));
            const plistUpdates = options.ios.plistUpdates[filepath];
            // check if updates are needed to avoid native build if not needed
            let needsUpdate = false;
            for (const key in plistUpdates) {
              if (Array.isArray(plistUpdates[key])) {
                try {
                  // compare stringified
                  const plistString = JSON.stringify(plistFile[key] || {});
                  const plistUpdateString = JSON.stringify(plistUpdates[key]);
                  if (plistString !== plistUpdateString) {
                    plistFile[key] = plistUpdates[key];
                    console.log(`Updating ${filepath}: ${key}=`, plistFile[key]);
                    needsUpdate = true;
                  }
                } catch (err) {
                  console.log(`plist file parse error:`, err);
                }
              } else if (plistFile[key] !== plistUpdates[key]) {
                plistFile[key] = plistUpdates[key];
                console.log(`Updating ${filepath}: ${key}=${plistFile[key]}`);
                needsUpdate = true;
              }
            }
            if (needsUpdate) {
              writeFileSync(plistPath, build(plistFile));
              console.log(`Updated: ${plistPath}`);
            }
          }
        }

        const xmlKeys = Object.keys(options.android.xmlUpdates || {});
        if (xmlKeys.length) {
          for (const filepath of xmlKeys) {
            let xmlPath: string;
            if (filepath.indexOf('.') === 0) {
              // resolve relative to project directory
              xmlPath = nodeResolve(projectCwd, filepath);
            } else {
              // default to locating in App_Resources
              xmlPath = nodeResolve(projectCwd, 'App_Resources', 'Android', filepath);
            }
            parseString(readFileSync(xmlPath, 'utf8'), (err, result) => {
              if (err) {
                throw err;
              }
              if (!result) {
                result = {};
              }
              // console.log('BEFORE---');
              // console.log(JSON.stringify(result, null, 2));

              const xmlUpdates = options.android.xmlUpdates[filepath];
              for (const key in xmlUpdates) {
                result[key] = {};
                for (const subKey in xmlUpdates[key]) {
                  result[key][subKey] = [];
                  for (let i = 0; i < xmlUpdates[key][subKey].length; i++) {
                    const node = xmlUpdates[key][subKey][i];
                    const attrName = Object.keys(node)[0];

                    result[key][subKey].push({
                      _: node[attrName],
                      $: {
                        name: attrName,
                      },
                    });
                  }
                }
              }

              // console.log('AFTER---');
              // console.log(JSON.stringify(result, null, 2));

              const builder = new Builder();
              const xml = builder.buildObject(result);
              writeFileSync(xmlPath, xml);
              console.log(`Updated: ${xmlPath}`);

              checkOptions();
            });
          }
        } else {
          checkOptions();
        }
      }
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}
