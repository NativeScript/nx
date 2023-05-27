import { ExecutorContext } from '@nx/devkit';
import { TestExecutorSchema, commonExecutor } from '../../utils';

export default async function testExecutor(options: TestExecutorSchema, context: ExecutorContext) {
  return commonExecutor(options, context, true);
}
