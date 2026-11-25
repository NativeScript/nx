import { ExecutorContext, TargetConfiguration } from '@nx/devkit';
import { combineOptionsForExecutor } from 'nx/src/devkit-internals';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import prepareSchema from '../executors/build/prepare.schema.json';

const { promptMock, spawnMock } = vi.hoisted(() => ({ promptMock: vi.fn(), spawnMock: vi.fn() }));
vi.mock('enquirer', () => ({ prompt: promptMock }));
vi.mock('child_process', () => ({ default: { spawn: spawnMock } }));

import { commonExecutor } from './executors';
import { ExecutorSchema } from './types';

const prepareTarget: TargetConfiguration = {
  executor: '@nativescript/nx:prepare',
  options: {
    noHmr: true,
    production: true,
    uglify: true,
    release: true,
    forDevice: true,
    prepare: true,
    provision: 'Options Profile',
    android: {
      keyStorePath: './options.keystore',
      keyStoreAlias: 'options-alias',
    },
  },
  configurations: {
    prod: {
      uglify: false,
      provision: 'Prod Profile',
      android: {
        keyStoreAlias: 'prod-alias',
        keyStorePassword: 'prod-password',
      },
    },
  },
};

async function runPrepare(cliOverrides: Record<string, unknown>, configurationName?: string, target = prepareTarget): Promise<string[]> {
  const options = combineOptionsForExecutor(
    cliOverrides,
    configurationName,
    structuredClone(target),
    prepareSchema as unknown as Parameters<typeof combineOptionsForExecutor>[3],
    'app',
    '',
  ) as ExecutorSchema;
  const context = {
    root: '/workspace',
    cwd: '/workspace',
    isVerbose: false,
    projectName: 'app',
    targetName: 'prepare',
    configurationName,
    projectsConfigurations: { version: 2, projects: { app: { root: 'apps/app', targets: { prepare: structuredClone(target) } } } },
  } as unknown as ExecutorContext;

  await commonExecutor(options, context);
  expect(spawnMock).toHaveBeenCalledTimes(1);
  return spawnMock.mock.calls[0][1];
}

describe('commonExecutor option precedence', () => {
  const originalIsTTY = process.stdin.isTTY;

  beforeEach(() => {
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    promptMock.mockReset();
    spawnMock.mockReset();
    spawnMock.mockImplementation(() => ({
      on: (event: string, listener: (code: number) => void) => event === 'close' && setImmediate(() => listener(0)),
      kill: vi.fn(),
    }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
    vi.restoreAllMocks();
  });

  it('applies project.json options when nothing is passed on the CLI', async () => {
    const args = await runPrepare({ platform: 'ios' });
    expect(args).toEqual(
      expect.arrayContaining(['prepare', 'ios', '--no-hmr', '--env.uglify', '--env.production', '--for-device', '--release', '--provision=Options Profile']),
    );
  });

  it('lets a boolean false on the CLI override true in options', async () => {
    const args = await runPrepare({ platform: 'ios', noHmr: false, release: false });
    expect(args).not.toContain('--no-hmr');
    expect(args).not.toContain('--release');
    expect(args).toContain('--env.uglify');
  });

  it('lets a string on the CLI override a string in options', async () => {
    const args = await runPrepare({ platform: 'ios', provision: 'CLI Profile' });
    expect(args).toContain('--provision=CLI Profile');
    expect(args).not.toContain('--provision=Options Profile');
  });

  it('applies the configuration over options', async () => {
    const args = await runPrepare({ platform: 'ios' }, 'prod');
    expect(args).toContain('--provision=Prod Profile');
    expect(args).not.toContain('--env.uglify');
    expect(args).toContain('--no-hmr');
  });

  it('lets the CLI override the configuration', async () => {
    const args = await runPrepare({ platform: 'ios', uglify: true, provision: 'CLI Profile', noHmr: false }, 'prod');
    expect(args).toContain('--env.uglify');
    expect(args).toContain('--provision=CLI Profile');
    expect(args).not.toContain('--no-hmr');
  });

  it('combines nested platform options from options, configuration and the CLI', async () => {
    const args = await runPrepare({ platform: 'android' }, 'prod');
    expect(args).toEqual(expect.arrayContaining(['--key-store-path=./options.keystore', '--key-store-alias=prod-alias', '--key-store-password=prod-password']));

    spawnMock.mockClear();
    const withCli = await runPrepare({ platform: 'android', android: { keyStorePassword: 'cli-password' } }, 'prod');
    expect(withCli).toEqual(
      expect.arrayContaining(['--key-store-path=./options.keystore', '--key-store-alias=prod-alias', '--key-store-password=cli-password']),
    );
  });

  it('lets the CLI override a configuration chosen at the prompt', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    promptMock.mockResolvedValue({ configurationName: 'prod' });
    const args = await runPrepare({ platform: 'ios', provision: 'CLI Profile', noHmr: false });
    expect(promptMock).toHaveBeenCalledTimes(1);
    expect(args).toContain('--provision=CLI Profile');
    expect(args).not.toContain('--no-hmr');
    expect(args).not.toContain('--env.uglify');
  });
});
