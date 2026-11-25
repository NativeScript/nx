import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { promptMock } = vi.hoisted(() => ({ promptMock: vi.fn() }));
vi.mock('enquirer', () => ({ prompt: promptMock }));

import { selectConfiguration, selectPlatform } from './executors';
import { ExecutorSchema } from './types';

describe('executor prompts', () => {
  const originalIsTTY = process.stdin.isTTY;

  function setTTY(value: boolean) {
    Object.defineProperty(process.stdin, 'isTTY', { value, configurable: true });
  }

  beforeEach(() => {
    promptMock.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
    vi.restoreAllMocks();
  });

  describe('selectConfiguration', () => {
    const configurations = { prod: {}, dev: {} };

    it('returns the requested configuration without prompting', async () => {
      setTTY(true);
      await expect(selectConfiguration(configurations, 'prod')).resolves.toBe('prod');
      expect(promptMock).not.toHaveBeenCalled();
    });

    it('prompts in an interactive terminal', async () => {
      setTTY(true);
      promptMock.mockResolvedValue({ configurationName: 'dev' });
      await expect(selectConfiguration(configurations, undefined)).resolves.toBe('dev');
      expect(promptMock).toHaveBeenCalledTimes(1);
    });

    it('continues with no configuration in a non-interactive terminal', async () => {
      setTTY(false);
      await expect(selectConfiguration(configurations, undefined)).resolves.toBeUndefined();
      expect(promptMock).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Continuing with no configuration'));
    });
  });

  describe('selectPlatform', () => {
    it('defaults to iOS when silent', async () => {
      setTTY(false);
      await expect(selectPlatform({ silent: true } as ExecutorSchema)).resolves.toBe('ios');
      expect(promptMock).not.toHaveBeenCalled();
    });

    it('fails with a clear error in a non-interactive terminal', async () => {
      setTTY(false);
      await expect(selectPlatform({} as ExecutorSchema)).rejects.toThrow('--platform');
      expect(promptMock).not.toHaveBeenCalled();
    });

    it('prompts in an interactive terminal', async () => {
      setTTY(true);
      promptMock.mockResolvedValue({ platform: 'android' });
      await expect(selectPlatform({} as ExecutorSchema)).resolves.toBe('android');
    });
  });
});
