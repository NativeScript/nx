import { readJson, readNxJson, readProjectConfiguration, Tree, updateNxJson, updateProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { init } from './init';

describe('init', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
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
});
