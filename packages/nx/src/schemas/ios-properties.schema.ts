import { KeysOfProperty } from '../utils/types';

export interface IosSchema {
  plistUpdates: Record<string, any>;
  provision: string;
}

export const iosSchema = {
  $schema: 'http://json-schema.org/schema',
  title: 'iOS Properties',
  description: '',
  type: 'object',
  properties: {
    ios: <KeysOfProperty<IosSchema>>{
      type: 'object',
      required: [],
      provision: {
        type: 'string',
        description: '(iOS Only) When building, use this provision profile name.',
      },
      plistUpdates: {
        type: 'object',
        description: "Update any .plist value. Specify name of any filename with key/value pairs, e.g. { 'Info.plist': { CFBundleDisplayName: 'MyApp' } }. Defaults to look in App_Resources/iOS/{filepath} however you can specify relative path if located elsewhere.",
      },
    },
  },
};
