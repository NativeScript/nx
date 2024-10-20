import { Tree, addProjectConfiguration, runTasksInSerial, GeneratorCallback, formatFiles } from '@nx/devkit';
import { initGenerator } from '@nx/js';
import { getAppNamingConvention, missingArgument, preRun, updatePluginDependencies, updatePluginSettings } from '../../utils';
import { appResources } from '../app-resources/app-resources';
import { assertNotUsingTsSolutionSetup } from '@nx/js/src/utils/typescript/ts-solution-setup';
import { normalizeOptions } from './lib/normalize-options';
import { addBuildTargetDefaults } from '@nx/devkit/src/generators/target-defaults-utils';
import { logShowProjectCommand } from '@nx/devkit/src/utils/log-show-project-command';
import { ApplicationSchema } from './schema';
import { createFiles } from './lib/create-files';
import { getProjectConfiguration } from './lib/project-json';

export async function applicationGenerator(tree: Tree, schema: ApplicationSchema) {
  assertNotUsingTsSolutionSetup(tree, 'nativescript', 'application');
  if (!schema.directory) {
    throw new Error(missingArgument('name', 'Provide a directory for your NativeScript app.', 'nx g @nativescript/nx:app <directory>'));
  }
  const commonOptions = preRun(tree, schema, true);
  schema = { ...schema, ...getAppNamingConvention(schema, 'nativescript') };

  const options = await normalizeOptions(tree, schema);

  const tasks: GeneratorCallback[] = [];

  tasks.push(
    await initGenerator(tree, {
      skipFormat: true,
    })
  );

  addBuildTargetDefaults(tree, options.buildExecutor);
  addProjectConfiguration(tree, options.name, getProjectConfiguration(options));

  createFiles(tree, options);
  // add extra files per options
  if (options.routing && ['angular'].includes(options.framework)) {
    createFiles(tree, options, 'routing');
  }
  // add app resources
  appResources(tree, {
    path: options.projectRoot,
  });

  updatePluginSettings(tree, options);
  tasks.push(updatePluginDependencies(tree, options));

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  tasks.push(() => logShowProjectCommand(options.name));

  return runTasksInSerial(...tasks);
}

export default applicationGenerator;
