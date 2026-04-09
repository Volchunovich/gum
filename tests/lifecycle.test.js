// tests/lifecycle.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CLI = path.resolve('bin/cli.js');
const INSTALLER = path.resolve('bin/install.js');

describe('uninstall', () => {
  let tmpHome;
  let tmpStorage;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gum-lifecycle-'));
    tmpStorage = path.join(tmpHome, 'gum-modules');
    fs.mkdirSync(tmpStorage, { recursive: true });
    execFileSync('node', [
      INSTALLER, '--claude', '--storage', tmpStorage, '--home', tmpHome,
    ], { encoding: 'utf-8' });
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('uninstall removes .gum and integration files but keeps storage', () => {
    execFileSync('node', [
      CLI, 'uninstall', '--gum-dir', path.join(tmpHome, '.gum'), '--home', tmpHome, '--yes',
    ], { encoding: 'utf-8' });

    expect(fs.existsSync(path.join(tmpHome, '.gum'))).toBe(false);
    expect(fs.existsSync(path.join(tmpHome, '.claude', 'rules', 'gum.md'))).toBe(false);
    expect(fs.existsSync(tmpStorage)).toBe(true);
  });
});
