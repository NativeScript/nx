import type { ApplicationSchema } from './schema';

export interface NormalizedSchema extends ApplicationSchema {
  baseName: string;
  projectName: string;
  projectRoot: string;
  projectSourceRoot: string;
  projectRootOffset: string;
  projectSourceRootOffset: string;
  parsedTags: string[];
  outputPath: string;
  buildExecutor: '@nativescript/nx:build';
  lintExecutor: '@nx/eslint:lint';
}
