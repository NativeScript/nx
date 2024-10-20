import { readJson, readProjectConfiguration, Tree, updateJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { libraryGenerator } from './library';
import { normalizeOptions } from './lib/normalize-options';
import { getAppNamingConvention, preRun, UnitTestRunner } from '../../utils';
import { LibrarySchema } from './schema';

describe('lib', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  describe('not nested', () => {
    it('should create library', async () => {
      const schema: LibrarySchema = { directory: 'libs/my-lib', unitTestRunner: 'none' };
      await libraryGenerator(tree, schema);

      const projectConfig = readProjectConfiguration(tree, 'nativescript-my-lib');
      const tsconfig = readJson(tree, `libs/nativescript-my-lib/tsconfig.json`);

      expect(projectConfig.name).toEqual('nativescript-my-lib');
      expect(projectConfig.root).toEqual('libs/nativescript-my-lib');
      expect(tree.exists(`libs/nativescript-my-lib/tsconfig.json`)).toBeTruthy();
      expect(tree.exists(`libs/nativescript-my-lib/references.d.ts`)).toBeTruthy();
      expect(tsconfig.files).toEqual(['./references.d.ts']);
      expect(tsconfig.include).toEqual(['**/*.ts']);
      expect(projectConfig.targets.lint).toEqual({
        executor: '@nx/eslint:lint',
      });
    });

    it('should create library w/ --groupByName=true', async () => {
      const schema: LibrarySchema = { directory: 'libs/my-lib', unitTestRunner: 'none', groupByName: true };
      await libraryGenerator(tree, schema);

      const projectConfig = readProjectConfiguration(tree, 'my-lib-nativescript');
      const tsconfig = readJson(tree, `libs/my-lib-nativescript/tsconfig.json`);

      expect(projectConfig.name).toEqual('my-lib-nativescript');
      expect(projectConfig.root).toEqual('libs/my-lib-nativescript');
      expect(tree.exists(`libs/my-lib-nativescript/tsconfig.json`)).toBeTruthy();
      expect(tree.exists(`libs/my-lib-nativescript/references.d.ts`)).toBeTruthy();
      expect(tsconfig.files).toEqual(['./references.d.ts']);
      expect(tsconfig.include).toEqual(['**/*.ts']);
      expect(projectConfig.targets.lint).toEqual({
        executor: '@nx/eslint:lint',
      });
    });

    it('should update root tsconfig.base.json paths', async () => {
      const schema: LibrarySchema = { directory: 'libs/my-lib' };
      await libraryGenerator(tree, schema);

      const tsconfigJson = readJson(tree, '/tsconfig.base.json');

      expect(tsconfigJson.compilerOptions.paths[`@proj/nativescript-my-lib`]).toEqual([`libs/nativescript-my-lib/src/index.ts`]);
    });

    it('should update root tsconfig.base.json paths w/ --groupByName=true', async () => {
      const schema: LibrarySchema = { directory: 'libs/my-lib', groupByName: true };
      await libraryGenerator(tree, schema);

      const tsconfigJson = readJson(tree, '/tsconfig.base.json');

      expect(tsconfigJson.compilerOptions.paths[`@proj/my-lib-nativescript`]).toEqual([`libs/my-lib-nativescript/src/index.ts`]);
    });

    it('should update root tsconfig.base.json paths (when no existing path mappings)', async () => {
      updateJson(tree, 'tsconfig.base.json', (json) => {
        json.compilerOptions.paths = undefined;
        return json;
      });

      const schema: LibrarySchema = { directory: 'libs/my-lib' };
      await libraryGenerator(tree, schema);

      const tsconfigJson = readJson(tree, '/tsconfig.base.json');

      expect(tsconfigJson.compilerOptions.paths[`@proj/nativescript-my-lib`]).toEqual([`libs/nativescript-my-lib/src/index.ts`]);
    });
  });
});
