import { ExecutorContext } from '@nrwl/devkit';
import { commonExecutor } from '../../utils';
import { ExecutorSchema } from '../../utils/types';

export default async function testExecutor(options: ExecutorSchema, context: ExecutorContext) {
  return commonExecutor(options, context);
}
