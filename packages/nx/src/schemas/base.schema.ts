import { COMMANDS } from '../utils/commands';
import { KeysOfProperty } from '../utils/types';

export type Platform = 'ios' | 'android';

export interface BaseSchema {
  command: COMMANDS;
  force: boolean;
  id: string;
  platform: Platform;
  silent: boolean;
  verbose: boolean;
}

export const baseSchema = {
  $schema: 'http://json-schema.org/schema',
  title: 'Base Schema',
  description: 'Base schema for all base properties.',
  type: 'object',
  properties: <KeysOfProperty<BaseSchema>>{
    command: {
      type: 'string',
      description: 'NativeScript CLI command to invoke',
      default: 'debug',
    },
    platform: {
      type: 'string',
      description: 'Platform to run on',
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
    id: {
      type: 'string',
      description: 'App bundle id. Use with configurations that desire a specific bundle id to be set.',
    },
    combineWithConfig: {
      type: 'string',
      description: 'Used with targets to share build configurations and avoid duplicating configurations across multiple targets.',
    },
  },
};