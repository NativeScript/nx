import { Tree } from '@angular-devkit/schematics';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { readJsonInTree } from '@nrwl/workspace';
import { updateJsonInTree } from '@nrwl/workspace';
import { runSchematic, callRule } from '../../utils/testing';

describe('init', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = Tree.empty();
    tree = createEmptyWorkspace(tree);
  });

  it('should add nativescript dependencies', async () => {
    const result = await runSchematic('init', {}, tree);
    const packageJson = readJsonInTree(result, 'package.json');
    expect(packageJson.dependencies['@nativescript/core']).toBeDefined();
    expect(packageJson.dependencies['@nativescript/theme']).toBeDefined();
  });

  it('should add .gitignore entries for NativeScript files and directories', async () => {
    tree.create('/.gitignore', `# NativeScript
/node_modules
`)
    tree=await runSchematic('init', {}, tree);

    const content = tree.read('/.gitignore').toString()

    expect(content).toMatch(/# NativeScript/);
  });

  describe('defaultCollection', () => {
    it('should be set if none was set before', async () => {
      const result = await runSchematic('init', {}, tree);
      const workspaceJson = readJsonInTree(result, 'workspace.json');
      expect(workspaceJson.cli.defaultCollection).toEqual('@nativescript/nx');
    });

    it('should not be set if something else was set before', async () => {
      tree = await callRule(
        updateJsonInTree('workspace.json', (json) => {
          json.cli = {
            defaultCollection: '@nrwl/workspace',
          };

          json.schematics = {};

          return json;
        }),
        tree
      );
      const result = await runSchematic('init', {}, tree);
      const workspaceJson = readJsonInTree(result, 'workspace.json');
      expect(workspaceJson.cli.defaultCollection).toEqual('@nrwl/workspace');
    });
  });
});