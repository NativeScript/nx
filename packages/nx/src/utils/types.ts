import { AndroidSchema } from '../schemas/android-properties.schema';
import { BaseSchema } from '../schemas/base.schema';
import { BuildSchema } from '../schemas/build.schema';
import { DebugSchema } from '../schemas/debug.schema';
import { IosSchema } from '../schemas/ios-properties.schema';
import { PrepareSchema } from '../schemas/prepare.schema';
import { RunSchema } from '../schemas/run.schema';
import { TestSchema } from '../schemas/test.schema';

export type KeysOfProperty<T> = {
  [P in keyof T]: Property;
};

export interface Property {
  type: string;
  description: string;
  default?: any;
  alias?: string;
}

export interface ExecutorSchema extends BaseSchema, BuildSchema, DebugSchema, PrepareSchema, RunSchema, TestSchema {
  android: AndroidSchema;
  ios: IosSchema;
}
