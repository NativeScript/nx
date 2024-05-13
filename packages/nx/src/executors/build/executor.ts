import { ExecutorContext } from '@nrwl/devkit';
import { commonExecutor } from '../../utils';
import { ExecutorSchema } from '../../utils/types';

export default async function runExecutor(options: ExecutorSchema, context: ExecutorContext) {
  return commonExecutor(options, context);
}
