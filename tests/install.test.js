// tests/install.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const INSTALLER = path.resolve('bin/install.js');

describe('install (non-interactive)', () => {
  let tmpHome;
  let tmpStorage;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gum-install-'));
    tmpStorage = path.join(tmpHome, 'gum-modules');
    fs.mkdirSync(tmpStorage, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('creates config, registry, and integration file', () => {
    execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome,
    ], { encoding: 'utf-8' });

    expect(fs.existsSync(path.join(tmpHome, '.gum', 'config.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, '.gum', 'registry.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, '.claude', 'rules', 'gum.md'))).toBe(true);
  });

  it('supports multiple runtimes', () => {
    execFileSync('node', [
      INSTALLER, '--claude', '--gemini', '--storage', tmpStorage, '--home', tmpHome,
    ], { encoding: 'utf-8' });

    expect(fs.existsSync(path.join(tmpHome, '.claude', 'rules', 'gum.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, '.gemini', 'rules', 'gum.md'))).toBe(true);
  });

  it('detects existing config on second install', () => {
    // First install
    execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome,
    ], { encoding: 'utf-8' });

    // Second install
    const out = execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome,
    ], { encoding: 'utf-8' });

    expect(out.toLowerCase()).toContain('existing');
  });
});
