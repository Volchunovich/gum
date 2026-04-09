import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runDoctor, repairDoctor } from '../lib/doctor.js';
import { writeRegistry } from '../lib/registry.js';
import { createModule } from '../lib/modules.js';

describe('doctor', () => {
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

  it('reports healthy when no issues', () => {
    createModule('small-mod', 'Small module', storagePath, tmpDir);
    const report = runDoctor(tmpDir);
    expect(report.healthy).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it('detects orphaned registry entries', () => {
    writeRegistry({
      storage: storagePath,
      modules: { ghost: '/nonexistent/path' },
    }, tmpDir);
    const report = runDoctor(tmpDir);
    expect(report.healthy).toBe(false);
    expect(report.issues.some(i => i.type === 'orphaned_entry')).toBe(true);
  });

  it('reports context budget', () => {
    createModule('mod-a', 'Module A', storagePath, tmpDir);
    const rulesPath = path.join(storagePath, 'mod-a', 'rules.md');
    fs.writeFileSync(rulesPath, 'line\n'.repeat(200));
    const report = runDoctor(tmpDir);
    expect(report.budget.total).toBe(200);
    expect(report.budget.overBudget).toBe(true);
  });

  it('detects missing registry file', () => {
    fs.unlinkSync(path.join(tmpDir, 'registry.json'));
    const report = runDoctor(tmpDir);
    expect(report.issues.some(i => i.type === 'missing_registry')).toBe(true);
  });

  it('repairDoctor removes orphaned entries', () => {
    writeRegistry({
      storage: storagePath,
      modules: { ghost: '/nonexistent/path', valid: storagePath },
    }, tmpDir);
    fs.mkdirSync(storagePath, { recursive: true });
    const result = repairDoctor(tmpDir);
    expect(result.removed).toContain('ghost');
    const reg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'registry.json'), 'utf-8'));
    expect(reg.modules.ghost).toBeUndefined();
  });
});
