import { writeFileSync } from 'fs-extra';
import { join } from 'path';
import { androidSchema } from '../schemas/android-properties.schema';
import { baseSchema } from '../schemas/base.schema';
import { buildSchema } from '../schemas/build.schema';
import { debugSchema } from '../schemas/debug.schema';
import { iosSchema } from '../schemas/ios-properties.schema';
import { prepareSchema } from '../schemas/prepare.schema';
import { runSchema } from '../schemas/run.schema';
import { testSchema } from '../schemas/test.schema';
import { cleanSchema } from '../schemas/clean.schema';

(async () => {
  const outputDirectory = join(__dirname, '..', 'executors', 'build');

  const outputs = [
    { name: 'build', schemas: [baseSchema, androidSchema, iosSchema, buildSchema] },
    { name: 'debug', schemas: [baseSchema, androidSchema, iosSchema, debugSchema] },
    { name: 'prepare', schemas: [baseSchema, androidSchema, iosSchema, prepareSchema] },
    { name: 'run', schemas: [baseSchema, androidSchema, iosSchema, runSchema] },
    { name: 'test', schemas: [baseSchema, androidSchema, iosSchema, testSchema] },
    { name: 'clean', schemas: [cleanSchema] },
  ];

  for (const output of outputs) {
    let combinedSchema;
    for (const schema of output.schemas) {
      combinedSchema = combinedSchema || schema;
      Object.assign(combinedSchema.properties, schema.properties);
      combinedSchema.title = schema?.title;
      combinedSchema.description = schema?.description;
    }
    writeFileSync(join(outputDirectory, output.name + '.schema.json'), JSON.stringify(combinedSchema, null, 2));
  }
})();
