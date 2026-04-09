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

  it('--starters flag installs starter modules into storage', () => {
    execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome, '--starters',
    ], { encoding: 'utf-8' });

    // Starter modules should exist in storage
    expect(fs.existsSync(path.join(tmpStorage, 'clean-commits', 'module.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpStorage, 'clean-commits', 'rules.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpStorage, 'code-quality', 'module.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpStorage, 'thoughtful-dev', 'module.yaml'))).toBe(true);

    // Should be registered in registry
    const reg = JSON.parse(fs.readFileSync(path.join(tmpHome, '.gum', 'registry.json'), 'utf-8'));
    expect(reg.modules['clean-commits']).toBeDefined();
    expect(reg.modules['code-quality']).toBeDefined();
    expect(reg.modules['thoughtful-dev']).toBeDefined();
  });

  it('without --starters flag does not install starters in non-interactive mode', () => {
    execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome,
    ], { encoding: 'utf-8' });

    // No starters should be installed
    expect(fs.existsSync(path.join(tmpStorage, 'clean-commits'))).toBe(false);
    expect(fs.existsSync(path.join(tmpStorage, 'code-quality'))).toBe(false);
  });

  it('--starters does not overwrite existing modules', () => {
    // Create a module with same name as starter
    const existingDir = path.join(tmpStorage, 'clean-commits');
    fs.mkdirSync(existingDir, { recursive: true });
    fs.writeFileSync(path.join(existingDir, 'rules.md'), 'custom rules');

    execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome, '--starters',
    ], { encoding: 'utf-8' });

    // Should keep original content, not overwrite
    const rules = fs.readFileSync(path.join(existingDir, 'rules.md'), 'utf-8');
    expect(rules).toBe('custom rules');
  });

  it('adds GUM permissions to Claude Code settings.json', () => {
    execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome,
    ], { encoding: 'utf-8' });

    const settingsPath = path.join(tmpHome, '.claude', 'settings.json');
    expect(fs.existsSync(settingsPath)).toBe(true);
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(settings.permissions).toBeDefined();
    expect(settings.permissions.allow).toContain('Read(~/.gum/**)');
    expect(settings.permissions.allow).toContain('Write(~/.gum/**)');
    expect(settings.permissions.allow.some(p => p.includes(tmpStorage))).toBe(true);
  });

  it('does not duplicate permissions on reinstall', () => {
    execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome,
    ], { encoding: 'utf-8' });
    execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome,
    ], { encoding: 'utf-8' });

    const settingsPath = path.join(tmpHome, '.claude', 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const gumReadCount = settings.permissions.allow.filter(p => p === 'Read(~/.gum/**)').length;
    expect(gumReadCount).toBe(1);
  });

  it('preserves existing settings when adding permissions', () => {
    // Create settings with existing content
    const settingsDir = path.join(tmpHome, '.claude');
    fs.mkdirSync(settingsDir, { recursive: true });
    fs.writeFileSync(path.join(settingsDir, 'settings.json'), JSON.stringify({
      enabledPlugins: { "some-plugin": true },
    }));

    execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome,
    ], { encoding: 'utf-8' });

    const settings = JSON.parse(fs.readFileSync(path.join(settingsDir, 'settings.json'), 'utf-8'));
    expect(settings.enabledPlugins['some-plugin']).toBe(true);
    expect(settings.permissions.allow).toContain('Read(~/.gum/**)');
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
