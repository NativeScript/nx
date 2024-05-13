import { KeysOfProperty } from '../utils/types';

export interface AndroidSchema {
  aab: boolean;
  keyStoreAlias: string;
  keyStoreAliasPassword: string;
  keyStorePassword: string;
  keyStorePath: string;
  xmlUpdates: Record<string, any>;
}

export const androidSchema = {
  $schema: 'http://json-schema.org/schema',
  title: 'Android Properties',
  description: '',
  type: 'object',
  properties: {
    android: <KeysOfProperty<AndroidSchema>>{
      type: 'object',
      aab: {
        type: 'boolean',
        default: false,
        description: '(Android Only) When building, create an Android App Bundle (.aab file).',
      },
      keyStorePath: {
        type: 'string',
        description: '(Android Only) When building, use the keystore file at this location.',
      },
      keyStorePassword: {
        type: 'string',
        description: '(Android Only) When building, use this keystore password.',
      },
      keyStoreAlias: {
        type: 'string',
        description: '(Android Only) When building, use this keystore alias.',
      },
      keyStoreAliasPassword: {
        type: 'string',
        description: '(Android Only) When building, use this keystore alias password.',
      },
      xmlUpdates: {
        type: 'object',
        description:
          "Update any .xml value. Specify name of any filename with key/value pairs, e.g. { 'src/main/res/values/strings.xml': { app_name: 'MyApp', title_activity_kimera: 'MyApp' } }. Defaults to look in App_Resources/Android/{filepath} however you can specify relative path if located elsewhere.",
      },
    },
  },
};
