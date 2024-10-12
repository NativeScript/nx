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
