import { JsonObject } from '@angular-devkit/core';

export interface TestBuilderSchema extends JsonObject {
  platform?: 'ios' | 'android';
  coverage?: boolean;
  device?: string;
  force?: boolean;
}
