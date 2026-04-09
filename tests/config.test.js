import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { readConfig, writeConfig, getGumDir, CONFIG_DEFAULTS } from '../lib/config.js';

describe('config', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gum-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns defaults when no config exists', () => {
    const config = readConfig(tmpDir);
    expect(config).toEqual(CONFIG_DEFAULTS);
  });

  it('writes and reads config', () => {
    const config = {
      runtimes: ['claude', 'gemini'],
      storage: '/home/user/modules',
    };
    writeConfig(config, tmpDir);
    const read = readConfig(tmpDir);
    expect(read.runtimes).toEqual(['claude', 'gemini']);
    expect(read.storage).toBe('/home/user/modules');
  });

  it('getGumDir returns ~/.gum by default', () => {
    const dir = getGumDir();
    expect(dir).toBe(path.join(os.homedir(), '.gum'));
  });
});
