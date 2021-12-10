import { Architect } from '@angular-devkit/architect';
import { TestingArchitectHost } from '@angular-devkit/architect/testing';
import { schema } from '@angular-devkit/core';
import { join } from 'path';
import { TestBuilderSchema } from './schema';
import runBuilder from './builder';

const options: TestBuilderSchema = {
  codeCoverage: false,
  platform: 'ios',
};

xdescribe('NativeScript Test Builder', () => {
  const context = {
    logger: {
      info: (args) => {
        console.log(args);
      },
    },
  } as any;
  let architect: Architect;
  let architectHost: TestingArchitectHost;

  beforeEach(async () => {
    const registry = new schema.CoreSchemaRegistry();
    registry.addPostTransform(schema.transforms.addUndefinedDefaults);

    architectHost = new TestingArchitectHost('/root', '/root');
    architect = new Architect(architectHost, registry);

    // This will either take a Node package name, or a path to the directory
    // for the package.json file.
    await architectHost.addBuilderFromPackage(join(__dirname, '../../..'));
  });
});
