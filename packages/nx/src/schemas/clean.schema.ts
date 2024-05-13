import { COMMANDS } from '../utils/commands';
import { KeysOfProperty } from '../utils/types';

export interface CleanSchema {
  command: COMMANDS;
}

export const cleanSchema = {
  $schema: 'http://json-schema.org/schema',
  title: 'NativeScript clean',
  description: '',
  type: 'object',
  properties: <KeysOfProperty<CleanSchema>>{
    command: {
      type: 'string',
      description: 'NativeScript CLI command to invoke',
      default: 'clean',
    },
    force: {
      type: 'boolean',
      default: true,
      description: 'If true, skips the application compatibility checks and forces npm i to ensure all dependencies are installed. Otherwise, the command will check the application compatibility with the current CLI version and could fail requiring ns migrate.',
    },
    silent: {
      type: 'boolean',
      default: false,
      description: 'If true, skips prompts.',
      alias: 's',
    },
    verbose: {
      type: 'boolean',
      default: false,
      description: 'Enable verbose logging',
    },
  },
  required: [],
};
