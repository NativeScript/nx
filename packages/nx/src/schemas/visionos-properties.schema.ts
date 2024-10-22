import { KeysOfProperty } from '../utils/types';
import { IosSchema } from './ios-properties.schema';

export interface visionOSSchema extends IosSchema {

}

export const visionOSSchema = {
  $schema: 'http://json-schema.org/schema',
  title: 'visionOS Properties',
  description: '',
  type: 'object',
  properties: {
    visionos: <KeysOfProperty<visionOSSchema>>{
      type: 'object',
      required: [],
      provision: {
        type: 'string',
        description: '(visionOS Only) When building, use this provision profile name.',
      },
      plistUpdates: {
        type: 'object',
        description: "Update any .plist value. Specify name of any filename with key/value pairs, e.g. { 'Info.plist': { CFBundleDisplayName: 'MyApp' } }. Defaults to look in App_Resources/visionOS/{filepath} however you can specify relative path if located elsewhere.",
      },
    },
  },
};
