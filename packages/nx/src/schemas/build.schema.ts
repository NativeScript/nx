import { COMMANDS } from '../utils/commands';
import { KeysOfProperty } from '../utils/types';

export interface BuildSchema {
  clean: boolean;
  command: COMMANDS;
  device: string;
  emulator: boolean;
  fileReplacements: any;
  forDevice: boolean;
  noHmr: boolean;
  production: boolean;
  release: boolean;
  uglify: boolean;
}

export const buildSchema = {
  $schema: 'http://json-schema.org/schema',
  title: 'NativeScript builder',
  description: '',
  type: 'object',
  properties: <KeysOfProperty<BuildSchema>>{
    command: {
      type: 'string',
      description: 'Platform to run on',
      default: 'build',
    },
    device: {
      type: 'string',
      description: 'Device identifier to run app on.',
      alias: 'd',
    },
    emulator: {
      type: 'boolean',
      default: false,
      description: 'Explicitly run with an emulator or simulator',
    },
    noHmr: {
      type: 'boolean',
      default: false,
      description: 'Disable HMR',
    },
    uglify: {
      type: 'boolean',
      default: false,
      description: 'Enable uglify during the webpack build',
    },
    release: {
      type: 'boolean',
      default: false,
      description: 'Enable release mode during build using the --release flag',
    },
    forDevice: {
      type: 'boolean',
      default: false,
      description: 'Build in device mode using the --for-device flag',
    },
    production: {
      type: 'boolean',
      default: false,
      description: 'Build in production mode using the --env.production flag',
      alias: 'prod',
    },
    fileReplacements: {
      description: 'Replace files with other files in the build.',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          replace: {
            type: 'string',
            description: 'The file to be replaced.',
          },
          with: {
            type: 'string',
            description: 'The file to replace with.',
          },
        },
        additionalProperties: false,
        required: ['replace', 'with'],
      },
      default: [],
    },
    clean: {
      type: 'boolean',
      default: false,
      description: 'Do a full project clean',
    },
  },
  required: [],
};
