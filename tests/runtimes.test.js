// tests/runtimes.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { RUNTIMES, getRulesPath, getSettingsPath, writeIntegrationFile, getRuntime, getModulesRulesDir } from '../lib/runtimes.js';

describe('runtimes', () => {
  let tmpHome;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gum-home-'));
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('RUNTIMES contains claude, gemini, copilot, cursor, windsurf', () => {
    expect(RUNTIMES.map(r => r.id)).toContain('claude');
    expect(RUNTIMES.map(r => r.id)).toContain('gemini');
    expect(RUNTIMES.map(r => r.id)).toContain('copilot');
    expect(RUNTIMES.map(r => r.id)).toContain('cursor');
    expect(RUNTIMES.map(r => r.id)).toContain('windsurf');
  });

  it('RUNTIMES contains opencode, kilo, codex, antigravity, augment, trae', () => {
    const ids = RUNTIMES.map(r => r.id);
    expect(ids).toContain('opencode');
    expect(ids).toContain('kilo');
    expect(ids).toContain('codex');
    expect(ids).toContain('antigravity');
    expect(ids).toContain('augment');
    expect(ids).toContain('trae');
  });

  it('opencode has correct rulesDir and settingsFile', () => {
    const rt = RUNTIMES.find(r => r.id === 'opencode');
    expect(rt.rulesDir).toBe('.opencode/rules');
    expect(rt.settingsFile).toBe('.opencode/settings.json');
  });

  it('kilo has correct rulesDir and null settingsFile', () => {
    const rt = RUNTIMES.find(r => r.id === 'kilo');
    expect(rt.rulesDir).toBe('.config/kilo/rules');
    expect(rt.settingsFile).toBeNull();
  });

  it('codex has correct rulesDir and settingsFile', () => {
    const rt = RUNTIMES.find(r => r.id === 'codex');
    expect(rt.rulesDir).toBe('.codex/rules');
    expect(rt.settingsFile).toBe('.codex/settings.json');
  });

  it('antigravity has correct rulesDir and null settingsFile', () => {
    const rt = RUNTIMES.find(r => r.id === 'antigravity');
    expect(rt.rulesDir).toBe('.gemini/antigravity/rules');
    expect(rt.settingsFile).toBeNull();
  });

  it('augment has correct rulesDir and null settingsFile', () => {
    const rt = RUNTIMES.find(r => r.id === 'augment');
    expect(rt.rulesDir).toBe('.augment/rules');
    expect(rt.settingsFile).toBeNull();
  });

  it('trae has correct rulesDir and null settingsFile', () => {
    const rt = RUNTIMES.find(r => r.id === 'trae');
    expect(rt.rulesDir).toBe('.trae/rules');
    expect(rt.settingsFile).toBeNull();
  });

  it('getRulesPath returns correct path for opencode', () => {
    const p = getRulesPath('opencode', tmpHome);
    expect(p).toBe(path.join(tmpHome, '.opencode', 'rules', 'gum.md'));
  });

  it('getSettingsPath returns null for augment', () => {
    const p = getSettingsPath('augment', tmpHome);
    expect(p).toBeNull();
  });

  it('writeIntegrationFile creates the file for codex', () => {
    writeIntegrationFile('codex', tmpHome);
    const p = getRulesPath('codex', tmpHome);
    expect(fs.existsSync(p)).toBe(true);
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain('GUM');
  });

  it('getRulesPath returns correct path for claude', () => {
    const p = getRulesPath('claude', tmpHome);
    expect(p).toBe(path.join(tmpHome, '.claude', 'rules', 'gum.md'));
  });

  it('writeIntegrationFile creates the file', () => {
    writeIntegrationFile('claude', tmpHome);
    const p = getRulesPath('claude', tmpHome);
    expect(fs.existsSync(p)).toBe(true);
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain('GUM');
    expect(content).toContain('.gum.json');
  });

  it('getModulesRulesDir returns correct path for claude', () => {
    const p = getModulesRulesDir('claude', tmpHome);
    expect(p).toBe(path.join(tmpHome, '.claude', 'rules', 'gum'));
  });

  it('getModulesRulesDir returns correct path for gemini', () => {
    const p = getModulesRulesDir('gemini', tmpHome);
    expect(p).toBe(path.join(tmpHome, '.gemini', 'rules', 'gum'));
  });

  it('getModulesRulesDir returns correct path for kilo', () => {
    const p = getModulesRulesDir('kilo', tmpHome);
    expect(p).toBe(path.join(tmpHome, '.config', 'kilo', 'rules', 'gum'));
  });

  it('getSettingsPath returns correct path for claude', () => {
    const p = getSettingsPath('claude', tmpHome);
    expect(p).toBe(path.join(tmpHome, '.claude', 'settings.json'));
  });

  it('getRulesPath returns correct path for kilo', () => {
    const p = getRulesPath('kilo', tmpHome);
    expect(p).toBe(path.join(tmpHome, '.config', 'kilo', 'rules', 'gum.md'));
  });

  it('getRulesPath returns correct path for trae', () => {
    const p = getRulesPath('trae', tmpHome);
    expect(p).toBe(path.join(tmpHome, '.trae', 'rules', 'gum.md'));
  });

  it('getSettingsPath returns correct path for opencode', () => {
    const p = getSettingsPath('opencode', tmpHome);
    expect(p).toBe(path.join(tmpHome, '.opencode', 'settings.json'));
  });

  it('getSettingsPath returns correct path for codex', () => {
    const p = getSettingsPath('codex', tmpHome);
    expect(p).toBe(path.join(tmpHome, '.codex', 'settings.json'));
  });

  it('getSettingsPath returns null for kilo', () => {
    const p = getSettingsPath('kilo', tmpHome);
    expect(p).toBeNull();
  });

  it('getSettingsPath returns null for trae', () => {
    const p = getSettingsPath('trae', tmpHome);
    expect(p).toBeNull();
  });

  it('getRuntime throws on unknown runtime ID', () => {
    expect(() => getRuntime('nonexistent-runtime')).toThrow('Unknown runtime');
  });
});
