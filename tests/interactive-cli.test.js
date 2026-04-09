// tests/interactive-cli.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { writeConfig } from '../lib/config.js';
import { writeRegistry } from '../lib/registry.js';
import { createModule } from '../lib/modules.js';

const CLI = path.resolve('bin/cli.js');

describe('toggle --local and --personal', () => {
  let tmpDir;
  let storagePath;
  let projectDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gum-cli-'));
    storagePath = path.join(tmpDir, 'modules');
    projectDir = path.join(tmpDir, 'project');
    fs.mkdirSync(storagePath, { recursive: true });
    fs.mkdirSync(projectDir, { recursive: true });
    writeConfig({ runtimes: ['claude'], storage: storagePath }, tmpDir);
    writeRegistry({ storage: storagePath, modules: {} }, tmpDir);
    createModule('mod-a', 'Module A', storagePath, tmpDir);
    createModule('mod-b', 'Module B', storagePath, tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('toggle --local creates .gum.json with overrides', () => {
    execFileSync('node', [
      CLI, 'toggle', '--local', '--module', 'mod-b', '--disable',
      '--gum-dir', tmpDir, '--project-dir', projectDir,
    ], { encoding: 'utf-8' });

    const gumJson = JSON.parse(
      fs.readFileSync(path.join(projectDir, '.gum.json'), 'utf-8'),
    );
    expect(gumJson.overrides['mod-b']).toBe(false);
  });

  it('toggle --personal creates .gum.local.json', () => {
    execFileSync('node', [
      CLI, 'toggle', '--personal', '--module', 'mod-a', '--disable',
      '--gum-dir', tmpDir, '--project-dir', projectDir,
    ], { encoding: 'utf-8' });

    const localJson = JSON.parse(
      fs.readFileSync(path.join(projectDir, '.gum.local.json'), 'utf-8'),
    );
    expect(localJson.overrides['mod-a']).toBe(false);
  });

  it('toggle global changes module.yaml', async () => {
    execFileSync('node', [
      CLI, 'toggle', '--module', 'mod-a', '--disable',
      '--gum-dir', tmpDir,
    ], { encoding: 'utf-8' });

    const YAML = (await import('yaml')).default;
    const manifest = YAML.parse(
      fs.readFileSync(path.join(storagePath, 'mod-a', 'module.yaml'), 'utf-8'),
    );
    expect(manifest.enabled).toBe(false);
  });

  it('remove --module deletes module', () => {
    execFileSync('node', [
      CLI, 'remove', '--module', 'mod-b',
      '--gum-dir', tmpDir,
    ], { encoding: 'utf-8' });

    const reg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'registry.json'), 'utf-8'));
    expect(reg.modules['mod-b']).toBeUndefined();
    expect(fs.existsSync(path.join(storagePath, 'mod-b'))).toBe(false);
  });
});
