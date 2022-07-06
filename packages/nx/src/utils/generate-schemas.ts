import { writeFileSync } from 'fs-extra';
import { join } from 'path';
import androidProperties from '../schemas/android-properties.schema.json';
import baseSchema from '../schemas/base.schema.json';
import buildSchema from '../schemas/build.schema.json';
import iosProperties from '../schemas/ios-properties.schema.json';

(async () => {

  const directory = join(__dirname, '..', 'executors', 'build');

  console.log(baseSchema);
  console.log(buildSchema);

  const outputs = [
    { name: 'build', schemas: [baseSchema, androidProperties, iosProperties, buildSchema] }
  ];

  for (const output of outputs) {
    let combinedSchema;
    for (const schema of output.schemas) {
      combinedSchema = combinedSchema || schema;
      Object.assign(combinedSchema.properties, schema.properties);
      combinedSchema.title = schema?.title;
      combinedSchema.description = schema?.description;
    }
    writeFileSync(join(directory, output.name + '.schema.json'), JSON.stringify(combinedSchema, null, 2));
  }
})();
