import { checkFilesExist, ensureNxProject, readJson, runNxCommandAsync, uniq } from '@nx/plugin/testing';
describe('nx e2e', () => {
  it('should create nx', async (done) => {
    const plugin = uniq('nx');
    ensureNxProject('@nativescript/nx', 'dist/packages/nx');
    await runNxCommandAsync(`generate @nativescript/nx:nx ${plugin}`);

    const result = await runNxCommandAsync(`build ${plugin}`);
    expect(result.stdout).toContain('Builder ran');

    done();
  });

  describe('--directory', () => {
    it('should create src in the specified directory', async (done) => {
      const plugin = uniq('nx');
      ensureNxProject('@nativescript/nx', 'dist/packages/nx');
      await runNxCommandAsync(`generate @nativescript/nx:nx ${plugin} --directory subdir`);
      expect(() => checkFilesExist(`libs/subdir/${plugin}/src/index.ts`)).not.toThrow();
      done();
    });
  });

  describe('--tags', () => {
    it('should add tags to nx.json', async (done) => {
      const plugin = uniq('nx');
      ensureNxProject('@nativescript/nx', 'dist/packages/nx');
      await runNxCommandAsync(`generate @nativescript/nx:nx ${plugin} --tags e2etag,e2ePackage`);
      const nxJson = readJson('nx.json');
      expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
      done();
    });
  });
});
