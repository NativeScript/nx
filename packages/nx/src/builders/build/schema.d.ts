import { JsonObject } from '@angular-devkit/core';

export interface BuildBuilderSchema extends JsonObject {
  debug?: boolean;
  device?: string;
  emulator?: boolean;
  clean?: boolean;
  noHmr?: boolean;
  uglify?: boolean;
  release?: boolean;
  forDevice?: boolean;
  production?: boolean;
  platform?: 'ios' | 'android';
} 
