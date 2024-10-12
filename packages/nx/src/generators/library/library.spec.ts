import { readJson, readProjectConfiguration, Tree, updateJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { library } from './library';
import { normalizeOptions } from './normalized-options';
import { getAppNamingConvention, preRun, UnitTestRunner } from '../../utils';
import { LibrarySchema } from './schema';

describe('lib', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    tree.write('/apps/.gitignore', '');
    tree.write('/libs/.gitignore', '');
  });

  describe('not nested', () => {
    it('should create library', async () => {
      const options: LibrarySchema = { directory: 'libs/my-lib', unitTestRunner: 'none' };
      await library(tree, options);
      const optionsWithNamingConvention = { ...options, ...getAppNamingConvention(options, 'nativescript') };
      const normalizedOptions = await normalizeOptions(tree, optionsWithNamingConvention);

      const libName = `nativescript-my-lib`;

      const projectConfig = readProjectConfiguration(tree, normalizedOptions.projectName);
      const tsconfig = readJson(tree, `${normalizedOptions.projectRoot}/tsconfig.json`);

      expect(projectConfig.name).toEqual(libName);
      expect(projectConfig.root).toMatch(new RegExp(`\/${libName}$`));
      expect(tree.exists(`${normalizedOptions.projectRoot}/tsconfig.json`)).toBeTruthy();
      expect(tree.exists(`${normalizedOptions.projectRoot}/references.d.ts`)).toBeTruthy();
      expect(tsconfig.files).toEqual(['./references.d.ts']);
      expect(tsconfig.include).toEqual(['**/*.ts']);
      expect(projectConfig.root).toEqual(normalizedOptions.projectRoot);
      expect(projectConfig.targets.lint).toEqual({
        executor: normalizedOptions.lintExecutor,
      });
    });

    it('should create library w/ --groupByName=true', async () => {
      const options: LibrarySchema = { directory: 'libs/my-lib', unitTestRunner: 'none', groupByName: true };
      await library(tree, options);
      const optionsWithNamingConvention = { ...options, ...getAppNamingConvention(options, 'nativescript') };
      const normalizedOptions = await normalizeOptions(tree, optionsWithNamingConvention);

      const libName = `my-lib-nativescript`;

      const projectConfig = readProjectConfiguration(tree, normalizedOptions.projectName);
      const tsconfig = readJson(tree, `${normalizedOptions.projectRoot}/tsconfig.json`);

      expect(projectConfig.name).toEqual(libName);
      expect(projectConfig.root).toMatch(new RegExp(`\/${libName}$`));
      expect(tree.exists(`${normalizedOptions.projectRoot}/tsconfig.json`)).toBeTruthy();
      expect(tree.exists(`${normalizedOptions.projectRoot}/references.d.ts`)).toBeTruthy();
      expect(tsconfig.files).toEqual(['./references.d.ts']);
      expect(tsconfig.include).toEqual(['**/*.ts']);
      expect(projectConfig.root).toEqual(normalizedOptions.projectRoot);
      expect(projectConfig.targets.lint).toEqual({
        executor: normalizedOptions.lintExecutor,
      });
    });

    it('should update root tsconfig.base.json paths', async () => {
      const options: LibrarySchema = { directory: 'libs/my-lib' };
      await library(tree, options);
      const optionsWithNamingConvention = { ...options, ...getAppNamingConvention(options, 'nativescript') };
      const normalizedOptions = await normalizeOptions(tree, optionsWithNamingConvention);

      const libName = `nativescript-my-lib`;

      const tsconfigJson = readJson(tree, '/tsconfig.base.json');

      expect(tsconfigJson.compilerOptions.paths[`@proj/${libName}`]).toEqual([`${normalizedOptions.projectSourceRoot}/index.ts`]);
    });

    it('should update root tsconfig.base.json paths w/ --groupByName=true', async () => {
      const options: LibrarySchema = { directory: 'libs/my-lib', groupByName: true };
      await library(tree, options);
      const optionsWithNamingConvention = { ...options, ...getAppNamingConvention(options, 'nativescript') };
      const normalizedOptions = await normalizeOptions(tree, optionsWithNamingConvention);

      const libName = `my-lib-nativescript`;

      const tsconfigJson = readJson(tree, '/tsconfig.base.json');

      expect(tsconfigJson.compilerOptions.paths[`@proj/${libName}`]).toEqual([`${normalizedOptions.projectSourceRoot}/index.ts`]);
    });

    it('should update root tsconfig.base.json paths (when no existing path mappings)', async () => {
      updateJson(tree, 'tsconfig.base.json', (json) => {
        json.compilerOptions.paths = undefined;
        return json;
      });

      const options: LibrarySchema = { directory: 'libs/my-lib' };
      await library(tree, options);
      const optionsWithNamingConvention = { ...options, ...getAppNamingConvention(options, 'nativescript') };
      const normalizedOptions = await normalizeOptions(tree, optionsWithNamingConvention);

      const libName = `nativescript-my-lib`;

      const tsconfigJson = readJson(tree, '/tsconfig.base.json');

      expect(tsconfigJson.compilerOptions.paths[`@proj/${libName}`]).toEqual([`${normalizedOptions.projectSourceRoot}/index.ts`]);
    });
  });
});
