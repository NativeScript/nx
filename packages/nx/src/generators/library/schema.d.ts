import { Linter } from '@nx/workspace/src/utils/lint';
import { LinterType } from '@nx/eslint';
import { UnitTestRunner } from '../../utils';

export interface LibrarySchema {
  directory: string;
  name?: string;
  groupByName?: boolean;
  linter?: Linter | LinterType;
  unitTestRunner?: UnitTestRunner;
  tags?: string;
  skipFormat?: boolean;
  skipTsConfig?: boolean;
  testEnvironment?: 'jsdom' | 'node';
  importPath?: string;
  pascalCaseFiles?: boolean;
  js?: boolean;
}
