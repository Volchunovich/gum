import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  readRegistry,
  writeRegistry,
  addModule,
  removeModule,
  getModulePath,
} from '../lib/registry.js';

describe('registry', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gum-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty registry when file does not exist', () => {
    const reg = readRegistry(tmpDir);
    expect(reg.storage).toBe('');
    expect(reg.modules).toEqual({});
  });

  it('writes and reads registry', () => {
    const reg = { storage: '/modules', modules: { foo: '/modules/foo' } };
    writeRegistry(reg, tmpDir);
    const read = readRegistry(tmpDir);
    expect(read.modules.foo).toBe('/modules/foo');
  });

  it('addModule adds entry to registry', () => {
    writeRegistry({ storage: '/modules', modules: {} }, tmpDir);
    addModule('bar', '/modules/bar', tmpDir);
    const reg = readRegistry(tmpDir);
    expect(reg.modules.bar).toBe('/modules/bar');
  });

  it('removeModule removes entry from registry', () => {
    writeRegistry({ storage: '/modules', modules: { bar: '/modules/bar' } }, tmpDir);
    removeModule('bar', tmpDir);
    const reg = readRegistry(tmpDir);
    expect(reg.modules.bar).toBeUndefined();
  });

  it('getModulePath returns path for known module', () => {
    writeRegistry({ storage: '/modules', modules: { baz: '/modules/baz' } }, tmpDir);
    expect(getModulePath('baz', tmpDir)).toBe('/modules/baz');
  });

  it('getModulePath returns null for unknown module', () => {
    writeRegistry({ storage: '/modules', modules: {} }, tmpDir);
    expect(getModulePath('unknown', tmpDir)).toBeNull();
  });
});
