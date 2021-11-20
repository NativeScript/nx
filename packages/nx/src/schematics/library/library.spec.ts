import { Tree } from '@angular-devkit/schematics';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { readJsonInTree, updateJsonInTree } from '@nrwl/workspace';

import { runSchematic } from '../../utils/testing';

describe('lib', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  describe('not nested', () => {
    it('should update workspace.json', async () => {
      const tree = await runSchematic('lib', { name: 'myLib' }, appTree);
      const workspaceJson = readJsonInTree(tree, '/workspace.json');
      const libName = `nativescript-my-lib`;

      expect(tree.exists(`libs/${libName}/tsconfig.json`)).toBeTruthy();
      expect(tree.exists(`libs/${libName}/references.d.ts`)).toBeTruthy();

      const tsconfig = readJsonInTree(tree, `libs/${libName}/tsconfig.json`);
      expect(tsconfig.files).toEqual(['./references.d.ts']);
      expect(tsconfig.include).toEqual(['**/*.ts']);

      expect(workspaceJson.projects[libName].root).toEqual(`libs/${libName}`);
      expect(workspaceJson.projects[libName].architect.build).toBeUndefined();
      expect(workspaceJson.projects[libName].architect.lint).toEqual({
        builder: '@nrwl/linter:eslint',
        options: {
          lintFilePatterns: [`libs/${libName}/**/*.ts`],
        },
        outputs: ['{options.outputFile}'],
      });
    });

    it('groupByName: should update workspace.json', async () => {
      const tree = await runSchematic('lib', { name: 'myLib', groupByName: true }, appTree);
      const workspaceJson = readJsonInTree(tree, '/workspace.json');
      const libName = `my-lib-nativescript`;

      expect(workspaceJson.projects[libName].root).toEqual(`libs/${libName}`);
      expect(workspaceJson.projects[libName].architect.build).toBeUndefined();
      expect(workspaceJson.projects[libName].architect.lint).toEqual({
        builder: '@nrwl/linter:eslint',
        options: {
          lintFilePatterns: [`libs/${libName}/**/*.ts`],
        },
        outputs: ['{options.outputFile}'],
      });
    });

    it('should update nx.json', async () => {
      const tree = await runSchematic('lib', { name: 'myLib', tags: 'one,two' }, appTree);
      const libName = `nativescript-my-lib`;
      const nxJson = readJsonInTree<any>(tree, '/nx.json');
      expect(nxJson.projects).toEqual({
        [libName]: {
          tags: ['one', 'two'],
        },
      });
    });

    it('should update root tsconfig.json', async () => {
      const tree = await runSchematic('lib', { name: 'myLib' }, appTree);
      const libName = `nativescript-my-lib`;
      const tsconfigJson = readJsonInTree(tree, '/tsconfig.base.json');
      expect(tsconfigJson.compilerOptions.paths[`@proj/${libName}`]).toEqual([`libs/${libName}/src/index.ts`]);
    });

    it('should update root tsconfig.json (no existing path mappings)', async () => {
      const updatedTree: any = updateJsonInTree('tsconfig.base.json', (json) => {
        json.compilerOptions.paths = undefined;
        return json;
      })(appTree, null);

      const tree = await runSchematic('lib', { name: 'myLib' }, updatedTree);
      const libName = `nativescript-my-lib`;
      const tsconfigJson = readJsonInTree(tree, '/tsconfig.base.json');
      expect(tsconfigJson.compilerOptions.paths[`@proj/${libName}`]).toEqual([`libs/${libName}/src/index.ts`]);
    });
  });
});
