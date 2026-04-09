import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exportModule, importModule } from '../lib/export.js';
import { createModule } from '../lib/modules.js';
import { writeRegistry, readRegistry } from '../lib/registry.js';

describe('export/import', () => {
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

  it('exportModule creates a .gum.json file', () => {
    createModule('test-mod', 'A test module', storagePath, tmpDir);
    const rulesPath = path.join(storagePath, 'test-mod', 'rules.md');
    fs.writeFileSync(rulesPath, '- Rule one\n- Rule two\n');

    const outPath = path.join(tmpDir, 'test-mod.gum.json');
    exportModule('test-mod', outPath, tmpDir);

    expect(fs.existsSync(outPath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    expect(data.gum_version).toBe('1.0.0');
    expect(data.module.name).toBe('test-mod');
    expect(data.rules).toContain('Rule one');
  });

  it('exportModule includes hooks if present', () => {
    createModule('test-mod', 'A test module', storagePath, tmpDir);
    const hooksData = { claude: { PostToolUse: [{ matcher: 'Edit', hooks: [] }] } };
    fs.writeFileSync(
      path.join(storagePath, 'test-mod', 'hooks.json'),
      JSON.stringify(hooksData),
    );

    const outPath = path.join(tmpDir, 'test-mod.gum.json');
    exportModule('test-mod', outPath, tmpDir);

    const data = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    expect(data.hooks.claude).toBeDefined();
  });

  it('importModule creates module from .gum.json file', () => {
    const exportData = {
      gum_version: '1.0.0',
      module: { name: 'imported', description: 'An imported module', version: '1.0.0' },
      rules: '- Imported rule\n',
      hooks: {},
    };
    const importPath = path.join(tmpDir, 'imported.gum.json');
    fs.writeFileSync(importPath, JSON.stringify(exportData));

    importModule(importPath, storagePath, tmpDir);

    const reg = readRegistry(tmpDir);
    expect(reg.modules.imported).toBeDefined();
    const rules = fs.readFileSync(path.join(storagePath, 'imported', 'rules.md'), 'utf-8');
    expect(rules).toContain('Imported rule');
  });

  it('importModule rejects bundle missing module.name', () => {
    const badBundle = {
      gum_version: '1.0.0',
      module: { description: 'No name here', version: '1.0.0' },
      rules: '- rule\n',
      hooks: {},
    };
    const importPath = path.join(tmpDir, 'bad.gum.json');
    fs.writeFileSync(importPath, JSON.stringify(badBundle));
    expect(() => importModule(importPath, storagePath, tmpDir)).toThrow('Invalid bundle');
  });

  it('importModule rejects path traversal names', () => {
    const badBundle = {
      gum_version: '1.0.0',
      module: { name: '../hack', description: 'Traversal', version: '1.0.0' },
      rules: '- rule\n',
      hooks: {},
    };
    const importPath = path.join(tmpDir, 'traversal.gum.json');
    fs.writeFileSync(importPath, JSON.stringify(badBundle));
    expect(() => importModule(importPath, storagePath, tmpDir)).toThrow('Invalid module name');
  });

  it('exportModule throws on non-existent module', () => {
    const outPath = path.join(tmpDir, 'ghost.gum.json');
    expect(() => exportModule('ghost-module', outPath, tmpDir)).toThrow('not found');
  });

  it('importModule writes hooks.json when hooks present', () => {
    const exportData = {
      gum_version: '1.0.0',
      module: { name: 'with-hooks', description: 'Has hooks', version: '1.0.0' },
      rules: '- rule\n',
      hooks: { claude: { PostToolUse: [{ matcher: 'Edit', hooks: [] }] } },
    };
    const importPath = path.join(tmpDir, 'with-hooks.gum.json');
    fs.writeFileSync(importPath, JSON.stringify(exportData));

    importModule(importPath, storagePath, tmpDir);

    const hooksPath = path.join(storagePath, 'with-hooks', 'hooks.json');
    expect(fs.existsSync(hooksPath)).toBe(true);
    const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));
    expect(hooks.claude).toBeDefined();
  });
});
