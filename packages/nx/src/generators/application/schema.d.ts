import { Linter, LinterType } from '@nx/eslint';
import { FrameworkTypes, UnitTestRunner } from '../../utils';

export interface ApplicationSchema {
  directory: string;
  name?: string;
  tags?: string;
  linter?: Linter | LinterType;
  skipFormat?: boolean;
  unitTestRunner?: UnitTestRunner;
  framework?: FrameworkTypes;
  routing?: boolean;
  groupByName?: boolean;
}

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
}
