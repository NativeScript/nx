import { COMMANDS } from '../utils/commands';
import { KeysOfProperty } from '../utils/types';

export interface TestSchema {
  command: COMMANDS;
  copyTo: string;
  coverage: boolean;
  debug: boolean;
  device: string;
  emulator: boolean;
  fileReplacements: any;
  forDevice: boolean;
  noHmr: boolean;
  prepare: boolean;
  production: boolean;
  release: boolean;
  uglify: boolean;
}

export const testSchema = {
  $schema: 'http://json-schema.org/schema',
  title: 'NativeScript builder',
  description: '',
  type: 'object',
  properties: <KeysOfProperty<TestSchema>>{
    command: {
      type: 'string',
      description: 'Platform to run on',
      default: 'test',
    },

    debug: {
      type: 'boolean',
      default: true,
      description: "Use 'ns debug' instead of 'ns run'. Defaults to true",
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
    },
    copyTo: {
      type: 'string',
      description: 'When building, copy the package to this location.',
    },
    prepare: {
      type: 'boolean',
      description: "Starts a Webpack compilation and prepares the app's App_Resources and the plugins platforms directories. The output is generated in a subdirectory for the selected target platform in the platforms directory. This lets you build the project for the selected platform.",
      default: false,
    },
    coverage: {
      type: 'boolean',
      description: '',
      default: false,
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
  },
  required: [],
};
