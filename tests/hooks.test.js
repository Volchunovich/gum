// tests/hooks.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { syncHooksToRuntime, removeHooksFromRuntime, readHooksManifest, syncAllHooks } from '../lib/hooks.js';
import { writeConfig } from '../lib/config.js';
import { writeRegistry } from '../lib/registry.js';

describe('hooks', () => {
  let tmpHome;
  let tmpGum;
  let moduleHooks;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gum-home-'));
    tmpGum = path.join(tmpHome, '.gum');
    fs.mkdirSync(tmpGum, { recursive: true });
    fs.mkdirSync(path.join(tmpHome, '.claude'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpHome, '.claude', 'settings.json'),
      JSON.stringify({}),
    );
    moduleHooks = {
      claude: {
        PostToolUse: [
          {
            matcher: 'Edit|Write',
            hooks: [{ type: 'command', command: 'echo formatted' }],
          },
        ],
      },
    };
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('syncHooksToRuntime merges hooks into settings.json', () => {
    syncHooksToRuntime('test-mod', moduleHooks, ['claude'], tmpGum, tmpHome);
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpHome, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(settings.hooks).toBeDefined();
    expect(settings.hooks.PostToolUse).toHaveLength(1);
  });

  it('syncHooksToRuntime updates hooks-manifest.json', () => {
    syncHooksToRuntime('test-mod', moduleHooks, ['claude'], tmpGum, tmpHome);
    const manifest = readHooksManifest(tmpGum);
    expect(manifest['test-mod']).toBeDefined();
    expect(manifest['test-mod'].claude).toBeDefined();
  });

  it('removeHooksFromRuntime cleans up hooks from settings', () => {
    syncHooksToRuntime('test-mod', moduleHooks, ['claude'], tmpGum, tmpHome);
    removeHooksFromRuntime('test-mod', ['claude'], tmpGum, tmpHome);
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpHome, '.claude', 'settings.json'), 'utf-8'),
    );
    const postToolUse = settings.hooks?.PostToolUse || [];
    expect(postToolUse).toHaveLength(0);
  });

  it('syncHooksToRuntime does not create duplicates when called twice', () => {
    syncHooksToRuntime('test-mod', moduleHooks, ['claude'], tmpGum, tmpHome);
    syncHooksToRuntime('test-mod', moduleHooks, ['claude'], tmpGum, tmpHome);
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpHome, '.claude', 'settings.json'), 'utf-8'),
    );
    // Should still be exactly 1 entry, not 2
    expect(settings.hooks.PostToolUse).toHaveLength(1);
  });

  it('syncAllHooks re-syncs cleanly without duplicates', () => {
    // Set up a proper gumDir with config and registry pointing to a module with hooks
    const modDir = path.join(tmpGum, 'modules', 'test-mod');
    fs.mkdirSync(modDir, { recursive: true });
    fs.writeFileSync(path.join(modDir, 'hooks.json'), JSON.stringify(moduleHooks), 'utf-8');
    writeConfig({ runtimes: ['claude'], storage: path.join(tmpGum, 'modules') }, tmpGum);
    writeRegistry({ storage: path.join(tmpGum, 'modules'), modules: { 'test-mod': modDir } }, tmpGum);

    // Sync once, then again
    syncAllHooks(tmpGum, tmpHome);
    syncAllHooks(tmpGum, tmpHome);

    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpHome, '.claude', 'settings.json'), 'utf-8'),
    );
    // Re-syncing twice should still produce exactly 1 entry
    expect(settings.hooks.PostToolUse).toHaveLength(1);
  });

  it('does not touch hooks from other modules', () => {
    syncHooksToRuntime('mod-a', moduleHooks, ['claude'], tmpGum, tmpHome);
    const otherHooks = {
      claude: {
        PostToolUse: [
          {
            matcher: 'Bash',
            hooks: [{ type: 'command', command: 'echo bash' }],
          },
        ],
      },
    };
    syncHooksToRuntime('mod-b', otherHooks, ['claude'], tmpGum, tmpHome);
    removeHooksFromRuntime('mod-a', ['claude'], tmpGum, tmpHome);
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpHome, '.claude', 'settings.json'), 'utf-8'),
    );
    expect(settings.hooks.PostToolUse).toHaveLength(1);
    expect(settings.hooks.PostToolUse[0].matcher).toBe('Bash');
  });
});
