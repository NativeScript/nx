import { readJson, readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from './application';
import { angularVersion, nsAngularVersion, rxjsVersion, zonejsVersion } from '../../utils/versions';

describe('app', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should update project.json', async () => {
    await applicationGenerator(tree, { directory: 'apps/my-app' });
    const config = readProjectConfiguration(tree, 'nativescript-my-app');

    expect(config.root).toEqual('apps/nativescript-my-app');
  });

  it('should generate eslint config file', async () => {
    await applicationGenerator(tree, { directory: 'apps/my-app' });
    const config = readProjectConfiguration(tree, 'nativescript-my-app');

    expect(tree.exists(`${config.root}/.eslintrc.json`)).toBeTruthy();
    expect(tree.exists(`${config.root}/eslint.config.js`)).toBeFalsy();
  });

  it('should generate eslint config file for the flat config', async () => {
    process.env.ESLINT_USE_FLAT_CONFIG = 'true';

    await applicationGenerator(tree, { directory: 'apps/my-app' });
    const config = readProjectConfiguration(tree, 'nativescript-my-app');

    expect(tree.exists(`${config.root}/.eslintrc.json`)).toBeFalsy();
    expect(tree.exists(`${config.root}/eslint.config.js`)).toBeTruthy();

    delete process.env.ESLINT_USE_FLAT_CONFIG;
  });

  it('should generate files', async () => {
    await applicationGenerator(tree, { directory: 'apps/my-app', framework: 'vanilla' });

    expect(tree.exists(`apps/nativescript-my-app/src/app-root.xml`)).toBeTruthy();
    expect(tree.exists(`apps/nativescript-my-app/src/main-page.ts`)).toBeTruthy();
    checkFiles(tree, 'apps/nativescript-my-app');
  });

  it('nested in directory: should generate files', async () => {
    await applicationGenerator(tree, { directory: 'apps/mobile/my-app', framework: 'vanilla' });

    expect(tree.exists(`apps/mobile/nativescript-my-app/src/app-root.xml`)).toBeTruthy();
    expect(tree.exists(`apps/mobile/nativescript-my-app/src/main-page.ts`)).toBeTruthy();
    checkFiles(tree, 'apps/mobile/nativescript-my-app', '../../../');
  });

  it('Angular with Routing: should generate files', async () => {
    await applicationGenerator(tree, { directory: 'apps/my-app', framework: 'angular', routing: true });
    const packageJson = readJson(tree, `package.json`);

    checkAngularFiles(tree, 'apps/nativescript-my-app');
    expect(tree.exists(`apps/nativescript-my-app/src/app.routing.ts`)).toBeTruthy();
    expect(tree.exists(`apps/nativescript-my-app/src/features/home/home.module.ts`)).toBeTruthy();
    // should also save framework as default in plugin settings
    expect(packageJson['nativescript-nx'].framework).toEqual('angular');
    checkFiles(tree, 'apps/nativescript-my-app');
  });

  it('Angular without Routing: should generate files', async () => {
    await applicationGenerator(tree, { directory: 'apps/my-app', framework: 'angular', routing: false });

    checkAngularFiles(tree, 'apps/nativescript-my-app');
    expect(tree.exists(`apps/nativescript-my-app/src/app.routing.ts`)).toBeFalsy();
    expect(tree.exists(`apps/nativescript-my-app/src/features/home/home.module.ts`)).toBeFalsy();
    checkFiles(tree, 'apps/nativescript-my-app');
  });

  it('Angular nested in directory: should generate files', async () => {
    await applicationGenerator(tree, { directory: 'apps/mobile/my-app', framework: 'angular', routing: true });

    checkAngularFiles(tree, 'apps/mobile/nativescript-my-app');
    expect(tree.exists(`apps/mobile/nativescript-my-app/src/app.routing.ts`)).toBeTruthy();
    expect(tree.exists(`apps/mobile/nativescript-my-app/src/features/home/home.module.ts`)).toBeTruthy();
    checkFiles(tree, 'apps/mobile/nativescript-my-app', '../../../');
  });

  it('should add angular dependencies when framework is angular', async () => {
    await applicationGenerator(tree, { directory: 'apps/my-app', framework: 'angular' });
    const packageJson = readJson(tree, `package.json`);

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
    await applicationGenerator(tree, { directory: 'apps/my-app', framework: void 0 });
    const packageJson = readJson(tree, `package.json`);

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

const checkFiles = (tree: Tree, appPath: string, relativeToRootPath = '../../') => {
  expect(tree.exists(`${appPath}/App_Resources/Android/app.gradle`)).toBeTruthy();
  expect(tree.exists(`${appPath}/App_Resources/iOS/Info.plist`)).toBeTruthy();

  const tsconfig = readJson(tree, `${appPath}/tsconfig.json`);
  expect(tsconfig.extends).toEqual(`${relativeToRootPath}tsconfig.base.json`);
};

const checkAngularFiles = (tree: Tree, appPath: string) => {
  expect(tree.exists(`${appPath}/src/app.component.ts`)).toBeTruthy();
  expect(tree.exists(`${appPath}/src/app.module.ts`)).toBeTruthy();
  expect(tree.exists(`${appPath}/src/environments/environment.ts`)).toBeTruthy();
  expect(tree.exists(`${appPath}/src/features/shared/shared.module.ts`)).toBeTruthy();
};
