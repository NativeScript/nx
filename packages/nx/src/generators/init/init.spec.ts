import { readJson, readWorkspaceConfiguration, Tree, updateWorkspaceConfiguration } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { init } from './init';

describe('init', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add nativescript dependencies', async () => {
    await init(tree, {});
    const packageJson = readJson(tree, 'package.json');
    expect(packageJson.dependencies['@nativescript/core']).toBeDefined();
    expect(packageJson.dependencies['@nativescript/theme']).toBeDefined();
  });

  it('should add .gitignore entries for NativeScript files and directories', async () => {
    tree.write(
      '/.gitignore',
      `# NativeScript
/node_modules
`
    );
    await init(tree, {});

    const content = tree.read('/.gitignore').toString();

    expect(content).toMatch(/# NativeScript/);
  });

  describe('defaultCollection', () => {
    beforeEach(() => {
      tree = createTreeWithEmptyWorkspace();
    });

    it('should be set if none was set before', async () => {
      let workspaceJson = readWorkspaceConfiguration(tree);
      updateWorkspaceConfiguration(tree, {
        version: 2,
        cli: {
          defaultCollection: null,
        },
      });
      await init(tree, {});
      workspaceJson = readWorkspaceConfiguration(tree);
      expect(workspaceJson.cli.defaultCollection).toEqual('@nativescript/nx');
    });
  });
});
