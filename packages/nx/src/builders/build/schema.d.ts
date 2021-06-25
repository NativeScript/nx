import { JsonObject } from '@angular-devkit/core';

export interface BuildBuilderSchema extends JsonObject {
  debug?: boolean;
  device?: string;
  emulator?: boolean;
  clean?: boolean;
  noHmr?: boolean;
  uglify?: boolean;
  verbose?: boolean;
  release?: boolean;
  forDevice?: boolean;
  production?: boolean;
  platform?: 'ios' | 'android';
  copyTo?: string;

  // ios only
  provision?: string;

  // android only
  aab?: boolean;
  keyStorePath?: string;
  keyStorePassword?: string;
  keyStoreAlias?: string;
  keyStoreAliasPassword?: string;
} 
