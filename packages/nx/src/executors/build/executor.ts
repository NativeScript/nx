import { ExecutorContext } from '@nrwl/devkit';
import { BuildExecutorSchema, commonExecutor } from '../../utils';

export default async function runExecutor(options: BuildExecutorSchema, context: ExecutorContext) {
  return commonExecutor(options, context);
}
