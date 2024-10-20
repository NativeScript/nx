import { LibrarySchema, NormalizedSchema } from '../schema';
import { joinPathFragments, offsetFromRoot, Tree } from '@nx/devkit';
import { determineProjectNameAndRootOptions, ensureProjectName } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { getBaseName } from '../../../utils';

export async function normalizeOptions(host: Tree, options: LibrarySchema): Promise<NormalizedSchema> {
  await ensureProjectName(host, options, 'application');
  const { projectName, projectRoot } = await determineProjectNameAndRootOptions(host, {
    name: options.name,
    projectType: 'application',
    directory: options.directory,
  });
  const parsedTags = options.tags ? options.tags.split(',').map((s) => s.trim()) : [];
  const projectSourceRoot = `${projectRoot}/src`;

  return {
    ...options,
    baseName: getBaseName({ directory: projectRoot }, 'nativescript'),
    directory: projectRoot,
    name: projectName,
    projectName,
    projectRoot,
    projectSourceRoot,
    projectRootOffset: offsetFromRoot(projectRoot),
    projectSourceRootOffset: offsetFromRoot(projectSourceRoot),
    parsedTags,
    outputPath: joinPathFragments('dist', projectRoot),
  };
}
