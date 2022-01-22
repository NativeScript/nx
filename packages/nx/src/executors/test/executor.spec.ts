import { TestBuilderSchema } from './schema';
import runBuilder from './executor';

const options: TestBuilderSchema = {
  coverage: false,
  platform: 'ios',
};

describe('Executor: test', () => {
  it('sample', () => {
    expect(true).toBe(true);
  })
});

// xdescribe('NativeScript Test Builder', () => {
//   const context = {
//     logger: {
//       info: (args) => {
//         console.log(args);
//       },
//     },
//   } as any;
//   let architect: Architect;
//   let architectHost: TestingArchitectHost;

//   beforeEach(async () => {
//     const registry = new schema.CoreSchemaRegistry();
//     registry.addPostTransform(schema.transforms.addUndefinedDefaults);

//     architectHost = new TestingArchitectHost('/root', '/root');
//     architect = new Architect(architectHost, registry);

//     // This will either take a Node package name, or a path to the directory
//     // for the package.json file.
//     await architectHost.addBuilderFromPackage(join(__dirname, '../../..'));
//   });
// });
