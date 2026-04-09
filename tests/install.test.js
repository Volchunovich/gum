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

  it('--help flag outputs usage info', () => {
    const out = execFileSync('node', [INSTALLER, '--help'], { encoding: 'utf-8' });
    expect(out).toContain('USAGE');
    expect(out).toContain('FLAGS');
    expect(out).toContain('--all');
    expect(out).toContain('--uninstall');
  });

  it('--all flag installs integration files for all runtimes', () => {
    execFileSync('node', [
      INSTALLER, '--all', '--storage', tmpStorage, '--home', tmpHome,
    ], { encoding: 'utf-8' });

    // Spot-check several runtimes are created
    expect(fs.existsSync(path.join(tmpHome, '.claude', 'rules', 'gum.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, '.gemini', 'rules', 'gum.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, '.opencode', 'rules', 'gum.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, '.codex', 'rules', 'gum.md'))).toBe(true);
  });

  it('--config-dir flag uses custom path for the given runtime', () => {
    const customDir = path.join(tmpHome, 'custom-claude');
    fs.mkdirSync(customDir, { recursive: true });
    execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome,
      '--config-dir', `claude=${customDir}`,
    ], { encoding: 'utf-8' });

    // Integration file should be in the custom dir, not the default .claude location
    expect(fs.existsSync(path.join(customDir, '.claude', 'rules', 'gum.md'))).toBe(true);
    // Default location should NOT have the file
    expect(fs.existsSync(path.join(tmpHome, '.claude', 'rules', 'gum.md'))).toBe(false);
  });

  it('CLAUDE_CONFIG_DIR env var overrides config directory', () => {
    const envDir = path.join(tmpHome, 'env-claude');
    fs.mkdirSync(envDir, { recursive: true });
    execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome,
    ], {
      encoding: 'utf-8',
      env: { ...process.env, CLAUDE_CONFIG_DIR: envDir },
    });

    // Integration file should be placed relative to the env-override dir
    expect(fs.existsSync(path.join(envDir, '.claude', 'rules', 'gum.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, '.claude', 'rules', 'gum.md'))).toBe(false);
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
