import { ExecutorContext } from '@nrwl/devkit';
import { BuildExecutorSchema } from '../../utils';
import runExecutor from './executor';

const options: BuildExecutorSchema = {
  noHmr: true,
  prepare: true,
  platform: 'ios',
};

describe('Executor: build', () => {
  it('sample', () => {
    expect(true).toBe(true);
  })
});

xdescribe('Command Runner Builder', () => {
  // const context = {
  //   logger: {
  //     info: (args) => {
  //       console.log(args);
  //     },
  //   },
  // } as any;
  // let architect: Architect;
  // let architectHost: TestingArchitectHost;

  // beforeEach(async () => {
  //   const registry = new schema.CoreSchemaRegistry();
  //   registry.addPostTransform(schema.transforms.addUndefinedDefaults);

  //   architectHost = new TestingArchitectHost('/root', '/root');
  //   architect = new Architect(architectHost, registry);

  //   // This will either take a Node package name, or a path to the directory
  //   // for the package.json file.
  //   await architectHost.addBuilderFromPackage(join(__dirname, '../../..'));
  // });

  // it('can run', async () => {
  //   const exec = spyOn(require('child_process'), 'spawn').and.callThrough();

  //   await runBuilder(
  //     {
  //       ...options,
  //     },
  //     context
  //   );
  //   expect(exec).toHaveBeenCalledWith('ns', ['debug', 'ios', '--no-hmr'], {
  //     // stdio: ["debug", "ios", "--no-hmr"],
  //     cwd: undefined,
  //     env: process.env,
  //     // maxBuffer: LARGE_BUFFER,
  //   });
  //   // A "run" can have multiple outputs, and contains progress information.
  //   // const run = await architect.scheduleBuilder('@nativescript/nx:build', options);
  //   // // The "result" member (of type BuilderOutput) is the next output.
  //   // const output = await run.result;

  //   // // Stop the builder from running. This stops Architect from keeping
  //   // // the builder-associated states in memory, since builders keep waiting
  //   // // to be scheduled.
  //   // await run.stop();

  //   // // Expect that it succeeded.
  //   // expect(output.success).toBe(true);
  // });
});
