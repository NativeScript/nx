import type { LibrarySchema } from './schema';

export interface NormalizedSchema extends LibrarySchema {
  baseName: string;
  projectName: string;
  projectRoot: string;
  projectSourceRoot: string;
  projectRootOffset: string;
  projectSourceRootOffset: string;
  parsedTags: string[];
  outputPath: string;
  lintExecutor: '@nx/eslint:lint';
}
