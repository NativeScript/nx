import { readJson, readProjectConfiguration, Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { library } from './library';

describe('lib', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    tree.write('/apps/.gitignore', '');
    tree.write('/libs/.gitignore', '');
  });

  describe('not nested', () => {
    it('should update project.json', async () => {
      await library(tree, { name: 'myLib', unitTestRunner: 'none' });
      const libName = `nativescript-my-lib`;

      expect(tree.exists(`libs/${libName}/tsconfig.json`)).toBeTruthy();
      expect(tree.exists(`libs/${libName}/references.d.ts`)).toBeTruthy();

      const tsconfig = readJson(tree, `libs/${libName}/tsconfig.json`);
      expect(tsconfig.files).toEqual(['./references.d.ts']);
      expect(tsconfig.include).toEqual(['**/*.ts']);

      const projectConfig = readProjectConfiguration(tree, libName);
      expect(projectConfig.root).toEqual(`libs/${libName}`);
      expect(projectConfig.targets.build).toBeUndefined();
      expect(projectConfig.targets.lint).toEqual({
        executor: '@nrwl/linter:eslint',
        options: {
          lintFilePatterns: [`libs/${libName}/**/*.ts`],
        },
        outputs: ['{options.outputFile}'],
      });
    });

    it('groupByName: should update workspace.json', async () => {
      await library(tree, { name: 'myLib', groupByName: true, unitTestRunner: 'none' });
      const libName = `my-lib-nativescript`;
      const projectConfig = readProjectConfiguration(tree, libName);

      expect(projectConfig.root).toEqual(`libs/${libName}`);
      expect(projectConfig.targets.build).toBeUndefined();
      expect(projectConfig.targets.lint).toEqual({
        executor: '@nrwl/linter:eslint',
        options: {
          lintFilePatterns: [`libs/${libName}/**/*.ts`],
        },
        outputs: ['{options.outputFile}'],
      });
    });

    it('should update root tsconfig.json', async () => {
      await library(tree, { name: 'myLib' });
      const libName = `nativescript-my-lib`;
      const tsconfigJson = readJson(tree, '/tsconfig.base.json');
      expect(tsconfigJson.compilerOptions.paths[`@proj/${libName}`]).toEqual([`libs/${libName}/src/index.ts`]);
    });

    it('should update root tsconfig.json (no existing path mappings)', async () => {
      updateJson(tree, 'tsconfig.base.json', (json) => {
        json.compilerOptions.paths = undefined;
        return json;
      });

      await library(tree, { name: 'myLib' });
      const libName = `nativescript-my-lib`;
      const tsconfigJson = readJson(tree, '/tsconfig.base.json');
      expect(tsconfigJson.compilerOptions.paths[`@proj/${libName}`]).toEqual([`libs/${libName}/src/index.ts`]);
    });
  });
});
