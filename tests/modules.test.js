import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import YAML from 'yaml';
import {
  createModule,
  readModuleManifest,
  writeModuleManifest,
  toggleModule,
  deleteModule,
  listModules,
  resolveEnabledModules,
} from '../lib/modules.js';
import { writeRegistry, readRegistry, addModule } from '../lib/registry.js';

describe('modules', () => {
  let tmpDir;
  let storagePath;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gum-test-'));
    storagePath = path.join(tmpDir, 'modules');
    fs.mkdirSync(storagePath, { recursive: true });
    writeRegistry({ storage: storagePath, modules: {} }, tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('createModule creates folder with module.yaml and rules.md', () => {
    createModule('test-mod', 'A test module', storagePath, tmpDir);
    const modDir = path.join(storagePath, 'test-mod');
    expect(fs.existsSync(path.join(modDir, 'module.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(modDir, 'rules.md'))).toBe(true);
  });

  it('createModule registers module in registry', () => {
    createModule('test-mod', 'A test module', storagePath, tmpDir);
    const reg = readRegistry(tmpDir);
    expect(reg.modules['test-mod']).toBe(path.join(storagePath, 'test-mod'));
  });

  it('readModuleManifest reads module.yaml', () => {
    createModule('test-mod', 'A test module', storagePath, tmpDir);
    const manifest = readModuleManifest(path.join(storagePath, 'test-mod'));
    expect(manifest.name).toBe('test-mod');
    expect(manifest.enabled).toBe(true);
  });

  it('toggleModule flips enabled flag', () => {
    createModule('test-mod', 'A test module', storagePath, tmpDir);
    const modPath = path.join(storagePath, 'test-mod');
    toggleModule(modPath, false);
    const manifest = readModuleManifest(modPath);
    expect(manifest.enabled).toBe(false);
  });

  it('deleteModule removes folder and unregisters', () => {
    createModule('test-mod', 'A test module', storagePath, tmpDir);
    deleteModule('test-mod', tmpDir);
    expect(fs.existsSync(path.join(storagePath, 'test-mod'))).toBe(false);
    const reg = readRegistry(tmpDir);
    expect(reg.modules['test-mod']).toBeUndefined();
  });

  it('listModules returns all modules with status', () => {
    createModule('mod-a', 'Module A', storagePath, tmpDir);
    createModule('mod-b', 'Module B', storagePath, tmpDir);
    toggleModule(path.join(storagePath, 'mod-b'), false);
    const mods = listModules(tmpDir);
    expect(mods).toHaveLength(2);
    expect(mods.find(m => m.name === 'mod-a').enabled).toBe(true);
    expect(mods.find(m => m.name === 'mod-b').enabled).toBe(false);
  });

  it('resolveEnabledModules applies per-project overrides', () => {
    createModule('mod-a', 'Module A', storagePath, tmpDir);
    createModule('mod-b', 'Module B', storagePath, tmpDir);
    const projectDir = path.join(tmpDir, 'project');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectDir, '.gum.json'),
      JSON.stringify({ overrides: { 'mod-b': false } }),
    );
    const enabled = resolveEnabledModules(tmpDir, projectDir);
    expect(enabled.find(m => m.name === 'mod-a')).toBeTruthy();
    expect(enabled.find(m => m.name === 'mod-b')).toBeFalsy();
  });

  it('createModule rejects invalid names with path separators', () => {
    expect(() => createModule('../hack', 'bad', storagePath, tmpDir)).toThrow('Invalid module name');
  });

  it('createModule rejects names with path traversal', () => {
    expect(() => createModule('path/traversal', 'bad', storagePath, tmpDir)).toThrow('Invalid module name');
  });

  it('createModule rejects empty name', () => {
    expect(() => createModule('', 'bad', storagePath, tmpDir)).toThrow('Invalid module name');
  });

  it('listModules skips modules with corrupt manifest without crashing', () => {
    // Create a valid module first
    createModule('good-mod', 'Good module', storagePath, tmpDir);
    // Manually create a directory with a broken module.yaml
    const badModDir = path.join(storagePath, 'bad-mod');
    fs.mkdirSync(badModDir, { recursive: true });
    fs.writeFileSync(path.join(badModDir, 'module.yaml'), 'name:\n\t- broken\n', 'utf-8');
    // Register bad-mod in the registry
    addModule('bad-mod', badModDir, tmpDir);

    const mods = listModules(tmpDir);
    // Should only return the good module; bad-mod is skipped
    expect(mods.find(m => m.name === 'good-mod')).toBeTruthy();
    expect(mods.find(m => m.name === 'bad-mod')).toBeFalsy();
  });

  it('readModuleManifest throws descriptive error on bad YAML', () => {
    const badModDir = path.join(storagePath, 'bad-yaml-mod');
    fs.mkdirSync(badModDir, { recursive: true });
    fs.writeFileSync(path.join(badModDir, 'module.yaml'), 'name:\n\t- broken\n', 'utf-8');
    expect(() => readModuleManifest(badModDir)).toThrow('Failed to parse module.yaml');
  });

  it('resolveEnabledModules applies .gum.local.json on top of .gum.json', () => {
    createModule('mod-a', 'Module A', storagePath, tmpDir);
    createModule('mod-b', 'Module B', storagePath, tmpDir);
    const projectDir = path.join(tmpDir, 'project');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectDir, '.gum.json'),
      JSON.stringify({ overrides: { 'mod-a': false, 'mod-b': false } }),
    );
    fs.writeFileSync(
      path.join(projectDir, '.gum.local.json'),
      JSON.stringify({ overrides: { 'mod-b': true } }),
    );
    const enabled = resolveEnabledModules(tmpDir, projectDir);
    expect(enabled.find(m => m.name === 'mod-a')).toBeFalsy();
    expect(enabled.find(m => m.name === 'mod-b')).toBeTruthy();
  });
});
