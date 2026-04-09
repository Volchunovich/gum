// tests/runtimes.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { RUNTIMES, getRulesPath, getSettingsPath, writeIntegrationFile } from '../lib/runtimes.js';

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
    expect(content).toContain('registry.json');
  });

  it('getSettingsPath returns correct path for claude', () => {
    const p = getSettingsPath('claude', tmpHome);
    expect(p).toBe(path.join(tmpHome, '.claude', 'settings.json'));
  });
});
