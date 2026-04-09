// tests/cli.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { writeConfig } from '../lib/config.js';
import { writeRegistry } from '../lib/registry.js';
import { createModule } from '../lib/modules.js';

const CLI = path.resolve('bin/cli.js');

describe('cli', () => {
  let tmpDir;
  let storagePath;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gum-cli-'));
    storagePath = path.join(tmpDir, 'modules');
    fs.mkdirSync(storagePath, { recursive: true });
    writeConfig({ runtimes: ['claude'], storage: storagePath }, tmpDir);
    writeRegistry({ storage: storagePath, modules: {} }, tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('list shows no modules when empty', () => {
    const out = execFileSync('node', [CLI, 'list', '--gum-dir', tmpDir], {
      encoding: 'utf-8',
    });
    expect(out).toContain('No modules');
  });

  it('list shows modules when present', () => {
    createModule('test-mod', 'Test module', storagePath, tmpDir);
    const out = execFileSync('node', [CLI, 'list', '--gum-dir', tmpDir], {
      encoding: 'utf-8',
    });
    expect(out).toContain('test-mod');
    expect(out).toContain('enabled');
  });

  it('doctor reports healthy', () => {
    const out = execFileSync('node', [CLI, 'doctor', '--gum-dir', tmpDir], {
      encoding: 'utf-8',
    });
    expect(out).toContain('healthy');
  });

  it('export creates .gum.json file', () => {
    createModule('test-mod', 'Test module', storagePath, tmpDir);
    const outFile = path.join(tmpDir, 'test-mod.gum.json');
    execFileSync('node', [CLI, 'export', 'test-mod', '--output', outFile, '--gum-dir', tmpDir], {
      encoding: 'utf-8',
    });
    expect(fs.existsSync(outFile)).toBe(true);
  });

  it('doctor --repair reports nothing to repair on clean install', () => {
    const out = execFileSync('node', [CLI, 'doctor', '--repair', '--gum-dir', tmpDir], {
      encoding: 'utf-8',
    });
    expect(out).toContain('Nothing to repair');
  });

  it('doctor --repair removes orphaned entry and reports it', () => {
    // Inject an orphaned entry directly into the registry
    writeRegistry({ storage: storagePath, modules: { ghost: '/nonexistent/path/ghost' } }, tmpDir);
    const out = execFileSync('node', [CLI, 'doctor', '--repair', '--gum-dir', tmpDir], {
      encoding: 'utf-8',
    });
    expect(out).toContain('ghost');
  });

  it('sync command outputs success message', () => {
    const out = execFileSync('node', [CLI, 'sync', '--gum-dir', tmpDir, '--home', tmpDir], {
      encoding: 'utf-8',
    });
    expect(out).toContain('Sync complete');
  });

  it('import creates module from .gum.json file', () => {
    const importData = {
      gum_version: '1.0.0',
      module: { name: 'imported', description: 'Imported', version: '1.0.0' },
      rules: '- rule\n',
      hooks: {},
    };
    const importFile = path.join(tmpDir, 'imported.gum.json');
    fs.writeFileSync(importFile, JSON.stringify(importData));
    execFileSync('node', [CLI, 'import', importFile, '--gum-dir', tmpDir], {
      encoding: 'utf-8',
    });
    const reg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'registry.json'), 'utf-8'));
    expect(reg.modules.imported).toBeDefined();
  });
});
