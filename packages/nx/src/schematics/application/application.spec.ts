import { Tree } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';
import { readJsonInTree } from '@nrwl/workspace';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { runSchematic } from '../../utils/testing';
import { angularVersion, nsAngularVersion, rxjsVersion, zonejsVersion } from '../../utils/versions';

describe('app', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should update workspace.json', async () => {
    const tree = await runSchematic('app', { name: 'myApp' }, appTree);
    const workspaceJson = readJsonInTree(tree, '/workspace.json');

    expect(workspaceJson.projects['nativescript-my-app'].root).toEqual('apps/nativescript-my-app/');
  });

  it('should update nx.json', async () => {
    const tree = await runSchematic('app', { name: 'myApp', tags: 'one,two' }, appTree);
    const nxJson = readJsonInTree<any>(tree, '/nx.json');
    expect(nxJson).toMatchObject({
      npmScope: 'proj',
      projects: {
        'nativescript-my-app': {
          tags: ['one', 'two'],
        },
      },
    });
  });

  it('should generate files', async () => {
    const tree = await runSchematic('app', { name: 'myApp', framework: 'vanilla' }, appTree);
    const appPath = 'apps/nativescript-my-app';
    expect(tree.exists(`${appPath}/src/app-root.xml`)).toBeTruthy();
    expect(tree.exists(`${appPath}/src/main-page.ts`)).toBeTruthy();
    checkFiles(tree, appPath);
  });

  it('nested in directory: should generate files', async () => {
    const tree = await runSchematic('app', { name: 'myApp', directory: 'mobile', framework: 'vanilla' }, appTree);
    const appPath = 'apps/mobile/nativescript-my-app';
    expect(tree.exists(`${appPath}/src/app-root.xml`)).toBeTruthy();
    expect(tree.exists(`${appPath}/src/main-page.ts`)).toBeTruthy();

    checkFiles(tree, appPath, '../../../');
  });

  it('Angular with Routing: should generate files', async () => {
    const tree = await runSchematic('app', { name: 'myApp', framework: 'angular' }, appTree);
    const appPath = 'apps/nativescript-my-app';
    checkAngularFiles(tree, appPath);

    expect(tree.exists(`${appPath}/src/app.routing.ts`)).toBeTruthy();
    expect(tree.exists(`${appPath}/src/features/home/home.module.ts`)).toBeTruthy();

    // should also save framework as default in plugin settings
    const packageJson = readJsonInTree(tree, `package.json`);
    expect(packageJson['nativescript-nx'].framework).toEqual('angular');

    checkFiles(tree, appPath);
  });

  it('Angular without Routing: should generate files', async () => {
    const tree = await runSchematic('app', { name: 'myApp', framework: 'angular', routing: false }, appTree);
    const appPath = 'apps/nativescript-my-app';
    checkAngularFiles(tree, appPath);

    expect(tree.exists(`${appPath}/src/app.routing.ts`)).toBeFalsy();
    expect(tree.exists(`${appPath}/src/features/home/home.module.ts`)).toBeFalsy();

    checkFiles(tree, appPath);
  });

  it('Angular nested in directory: should generate files', async () => {
    const tree = await runSchematic('app', { name: 'myApp', framework: 'angular', directory: 'mobile' }, appTree);
    const appPath = 'apps/mobile/nativescript-my-app';
    checkAngularFiles(tree, appPath);

    expect(tree.exists(`${appPath}/src/app.routing.ts`)).toBeTruthy();
    expect(tree.exists(`${appPath}/src/features/home/home.module.ts`)).toBeTruthy();

    checkFiles(tree, appPath, '../../../');
  });

  it('should add angular dependencies when framework is angular', async () => {
    const tree = await runSchematic('app', { name: 'myApp', framework: 'angular' }, appTree);
    const packageJson = readJsonInTree(tree, `package.json`);

    expect(packageJson['dependencies']['@angular/animations']).toEqual(angularVersion);
    expect(packageJson['dependencies']['@angular/common']).toEqual(angularVersion);
    expect(packageJson['dependencies']['@angular/compiler']).toEqual(angularVersion);
    expect(packageJson['dependencies']['@angular/core']).toEqual(angularVersion);
    expect(packageJson['dependencies']['@angular/forms']).toEqual(angularVersion);
    expect(packageJson['dependencies']['@angular/platform-browser']).toEqual(angularVersion);
    expect(packageJson['dependencies']['@angular/platform-browser-dynamic']).toEqual(angularVersion);
    expect(packageJson['dependencies']['@angular/router']).toEqual(angularVersion);
    expect(packageJson['dependencies']['rxjs']).toEqual(rxjsVersion);
    expect(packageJson['dependencies']['zone.js']).toEqual(zonejsVersion);
    expect(packageJson['dependencies']['@nativescript/angular']).toEqual(nsAngularVersion);
  });

  it('should not add angular dependencies when framework is not angular', async () => {
    const tree = await runSchematic('app', { name: 'myApp', framework: '' }, appTree);
    const packageJson = readJsonInTree(tree, `package.json`);

    expect(packageJson['dependencies']['@angular/animations']).toBeFalsy();
    expect(packageJson['dependencies']['@angular/common']).toBeFalsy();
    expect(packageJson['dependencies']['@angular/compiler']).toBeFalsy();
    expect(packageJson['dependencies']['@angular/core']).toBeFalsy();
    expect(packageJson['dependencies']['@angular/forms']).toBeFalsy();
    expect(packageJson['dependencies']['@angular/platform-browser']).toBeFalsy();
    expect(packageJson['dependencies']['@angular/platform-browser-dynamic']).toBeFalsy();
    expect(packageJson['dependencies']['@angular/router']).toBeFalsy();
    expect(packageJson['dependencies']['rxjs']).toBeFalsy();
    expect(packageJson['dependencies']['zone.js']).toBeFalsy();
    expect(packageJson['dependencies']['@nativescript/angular']).toBeFalsy();
  });
});

const checkFiles = (tree: UnitTestTree, appPath: string, relativeToRootPath = '../../') => {
  expect(tree.exists(`${appPath}/App_Resources/Android/app.gradle`)).toBeTruthy();
  expect(tree.exists(`${appPath}/App_Resources/iOS/Info.plist`)).toBeTruthy();

  const tsconfig = readJsonInTree(tree, `${appPath}/tsconfig.json`);
  expect(tsconfig.extends).toEqual(`${relativeToRootPath}tsconfig.base.json`);

  expect(tree.exists(`${appPath}/.eslintrc.json`)).toBeTruthy();
};

const checkAngularFiles = (tree: UnitTestTree, appPath: string) => {
  expect(tree.exists(`${appPath}/src/app.component.ts`)).toBeTruthy();
  expect(tree.exists(`${appPath}/src/app.module.ts`)).toBeTruthy();
  expect(tree.exists(`${appPath}/src/environments/environment.ts`)).toBeTruthy();
  expect(tree.exists(`${appPath}/src/features/shared/shared.module.ts`)).toBeTruthy();
};
