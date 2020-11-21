import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { join } from 'path';

import { NxSchematicSchema } from './schema';

describe('nx schematic', () => {
  let appTree: Tree;
  const options: NxSchematicSchema = { name: 'test' };

  const testRunner = new SchematicTestRunner(
    '@nx-plugin/nx',
    join(__dirname, '../../../collection.json')
  );

  beforeEach(() => {
    appTree = createEmptyWorkspace(Tree.empty());
  });

  it('should run successfully', async () => {
    await expect(
      testRunner.runSchematicAsync('nx', options, appTree).toPromise()
    ).resolves.not.toThrowError();
  });
});
