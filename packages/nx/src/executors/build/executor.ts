import { ExecutorContext, convertNxExecutor } from '@nrwl/devkit';
import * as childProcess from 'child_process';
import { resolve as nodeResolve } from 'path';
import { parse, build } from 'plist';
import { parseString, Builder } from 'xml2js';
import { readFileSync, writeFileSync } from 'fs-extra';
import { BuildBuilderSchema } from './schema';

export default async function runExecutor(options: BuildBuilderSchema, context: ExecutorContext): Promise<{ success: boolean }> {
  return new Promise((resolve, reject) => {
    try {
      const projectConfig = context.workspace.projects[context.projectName];
      // determine if running or building only
      const isBuild = context.targetName === 'build' || process.argv.find((a) => a === 'build' || a.endsWith(':build'));
      if (isBuild) {
        // allow build options to override run target options
        const buildTarget = projectConfig.targets['build'];
        if (buildTarget && buildTarget.options) {
          options = {
            ...options,
            ...buildTarget.options,
          };
        }
      }
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

      const nsCliFileReplacements: Array<string> = [];
      let configOptions;
      if (context.target.configurations) {
        configOptions = context.target.configurations[targetConfigName];
        // console.log('configOptions:', configOptions)

        if (isBuild) {
          // merge any custom build options for the target
          const targetBuildConfig = context.target.configurations['build'];
          if (targetBuildConfig) {
            options = {
              ...options,
              ...targetBuildConfig,
            };
          }
        }

        if (configOptions) {
          if (configOptions.fileReplacements) {
            for (const r of configOptions.fileReplacements) {
              nsCliFileReplacements.push(`${r.replace.replace(projectCwd, './')}:${r.with.replace(projectCwd, './')}`);
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
                      nsCliFileReplacements.push(`${r.replace.replace(projectCwd, './')}:${r.with.replace(projectCwd, './')}`);
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
        } else if (options.prepare) {
          nsOptions.push('prepare');
        } else {
          if (options.debug === false) {
            nsOptions.push('run');
          } else {
            // default to debug mode
            nsOptions.push('debug');
          }
        }

        if (!options.platform) {
          // a platform must be set
          // absent of it being explicitly set, we default to 'ios'
          // this helps cases where nx run-many is used for general targets used in, for example, pull request auto prepare/build checks (just need to know if there are any .ts errors in the build where platform often doesn't matter - much)
          options.platform = 'ios';
        }

        if (options.platform) {
          nsOptions.push(options.platform);
        }
        if (options.device && !options.emulator) {
          nsOptions.push(`--device=${options.device}`);
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
        if (options.aab) {
          nsOptions.push('--aab');
        }
        if (options.keyStorePath) {
          nsOptions.push(`--key-store-path=${options.keyStorePath}`);
        }
        if (options.keyStorePassword) {
          nsOptions.push(`--key-store-password=${options.keyStorePassword}`);
        }
        if (options.keyStoreAlias) {
          nsOptions.push(`--key-store-alias=${options.keyStoreAlias}`);
        }
        if (options.keyStoreAliasPassword) {
          nsOptions.push(`--key-store-alias-password=${options.keyStoreAliasPassword}`);
        }
        if (options.provision) {
          nsOptions.push(`--provision=${options.provision}`);
        }
        if (options.copyTo) {
          nsOptions.push(`--copy-to=${options.copyTo}`);
        }

        if (nsCliFileReplacements.length) {
          // console.log('nsCliFileReplacements:', nsCliFileReplacements);
          nsOptions.push(`--env.replace=${nsCliFileReplacements.join(',')}`);
        }
        // always add --force (unless explicity set to false) for now since within Nx we use @nativescript/webpack at root only and the {N} cli shows a blocking error if not within the app
        if (options?.force !== false) {
          nsOptions.push('--force');
        }
      }

      // some options should never be duplicated
      const enforceSingularOptions = ['provision', 'device', 'copy-to'];
      const parseOptionName = (flag: string) => {
        // strip just the option name from extra arguments
        // --provision='match AppStore my.bundle.com' > provision
        return flag.split('=')[0].replace('--', '');
      };
      // additional cli flags
      // console.log('projectTargetCmdIndex:', projectTargetCmdIndex)
      const additionalArgs = [];
      if (options.flags) {
        // persisted flags in configurations
        additionalArgs.push(...options.flags.split(' '));
      }
      if (!options.clean && process.argv.length > projectTargetCmdIndex + 1) {
        // manually added flags to the execution command
        const extraFlags = process.argv.slice(projectTargetCmdIndex + 1, process.argv.length);
        for (const flag of extraFlags) {
          const optionName = parseOptionName(flag);
          if (optionName?.indexOf('/') === -1 && optionName?.indexOf('{') === -1) {
            // no valid options should start with '/' or '{' - those are often extra process.argv context args that should be ignored
            if (!nsOptions.includes(flag) && !additionalArgs.includes(flag) && !enforceSingularOptions.includes(optionName)) {
              additionalArgs.push(flag);
            }
          }
        }
        // console.log('additionalArgs:', additionalArgs);
      }

      const runCommand = function () {
        console.log(`――――――――――――――――――――――――${options.clean ? '' : options.platform === 'ios' ? ' ' : ' 🤖'}`);
        console.log(`Running NativeScript CLI within ${projectCwd}`);
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
          checkAppId().then(id => {
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
          })
        } else {
          runCommand();
        }
      };

      if (options.clean) {
        runCommand();
      } else {
        const plistKeys = Object.keys(options.plistUpdates || {});
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
            const plistUpdates = options.plistUpdates[filepath];
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

        const xmlKeys = Object.keys(options.xmlUpdates || {});
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

              const xmlUpdates = options.xmlUpdates[filepath];
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
