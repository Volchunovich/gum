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

  it('readConfig merges with CONFIG_DEFAULTS when a field is missing', () => {
    // Write a config.yaml that only has storage, missing runtimes
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'config.yaml'), 'storage: /custom/path\n', 'utf-8');
    const config = readConfig(tmpDir);
    // storage from file
    expect(config.storage).toBe('/custom/path');
    // runtimes from CONFIG_DEFAULTS (empty array)
    expect(config.runtimes).toEqual(CONFIG_DEFAULTS.runtimes);
  });

  it('readConfig throws a descriptive error on malformed YAML', () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    // Tabs as indentation are illegal in YAML and will cause a parse error
    fs.writeFileSync(path.join(tmpDir, 'config.yaml'), 'runtimes:\n\t- claude\n', 'utf-8');
    expect(() => readConfig(tmpDir)).toThrow('Failed to parse config.yaml');
  });
});
