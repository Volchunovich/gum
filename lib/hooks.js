/**
 * Hooks — Runtime hook sync with manifest tracking
 */
import fs from 'fs';
import path from 'path';
import { getSettingsPath } from './runtimes.js';
import { readConfig } from './config.js';
import { readRegistry } from './registry.js';
import { readJSON } from './utils.js';

/**
 * Read the GUM hooks manifest from disk.
 * @param {string} gumDir - GUM config directory.
 * @returns {Record<string, Record<string, string[]>>} Hooks manifest keyed by module name.
 */
export function readHooksManifest(gumDir) {
  const manifestPath = path.join(gumDir, 'hooks-manifest.json');
  if (!fs.existsSync(manifestPath)) return {};
  return readJSON(manifestPath);
}

function writeHooksManifest(manifest, gumDir) {
  const manifestPath = path.join(gumDir, 'hooks-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

function tagHookEntry(entry, moduleName) {
  return { ...entry, _gum_module: moduleName };
}

/**
 * Sync a module's hooks into the settings files of the given runtimes.
 * Existing entries for this module are removed before re-adding to prevent duplicates.
 * @param {string} moduleName - Module name.
 * @param {Record<string, Record<string, object[]>>} moduleHooks - Hooks definition from hooks.json.
 * @param {string[]} runtimes - Runtime IDs to sync into.
 * @param {string} gumDir - GUM config directory.
 * @param {string} homeDir - Home directory.
 * @returns {void}
 */
export function syncHooksToRuntime(moduleName, moduleHooks, runtimes, gumDir, homeDir) {
  const manifest = readHooksManifest(gumDir);
  manifest[moduleName] = {};

  for (const runtimeId of runtimes) {
    const runtimeHooks = moduleHooks[runtimeId];
    if (!runtimeHooks) continue;

    const settingsPath = getSettingsPath(runtimeId, homeDir);
    if (!settingsPath) continue;

    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = readJSON(settingsPath);
    }
    if (!settings.hooks) settings.hooks = {};

    // Remove existing entries for this module to avoid duplicates
    for (const [eventName, entries] of Object.entries(settings.hooks)) {
      settings.hooks[eventName] = entries.filter(e => e._gum_module !== moduleName);
      if (settings.hooks[eventName].length === 0) delete settings.hooks[eventName];
    }

    manifest[moduleName][runtimeId] = [];

    for (const [eventName, entries] of Object.entries(runtimeHooks)) {
      if (!settings.hooks[eventName]) settings.hooks[eventName] = [];
      for (const entry of entries) {
        const tagged = tagHookEntry(entry, moduleName);
        settings.hooks[eventName].push(tagged);
        manifest[moduleName][runtimeId].push(eventName);
      }
    }

    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  }

  writeHooksManifest(manifest, gumDir);
}

/**
 * Remove a module's hooks from the settings files of the given runtimes.
 * @param {string} moduleName - Module name whose hooks should be removed.
 * @param {string[]} runtimes - Runtime IDs to clean up.
 * @param {string} gumDir - GUM config directory.
 * @param {string} homeDir - Home directory.
 * @returns {void}
 */
export function removeHooksFromRuntime(moduleName, runtimes, gumDir, homeDir) {
  for (const runtimeId of runtimes) {
    const settingsPath = getSettingsPath(runtimeId, homeDir);
    if (!settingsPath || !fs.existsSync(settingsPath)) continue;

    const settings = readJSON(settingsPath);
    if (!settings.hooks) continue;

    for (const [eventName, entries] of Object.entries(settings.hooks)) {
      settings.hooks[eventName] = entries.filter(e => e._gum_module !== moduleName);
      if (settings.hooks[eventName].length === 0) delete settings.hooks[eventName];
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  }

  const manifest = readHooksManifest(gumDir);
  delete manifest[moduleName];
  writeHooksManifest(manifest, gumDir);
}

/**
 * Re-sync all module hooks to all configured runtimes.
 * Clears all GUM-managed hooks first, then re-adds from each module's hooks.json.
 * @param {string} gumDir - GUM config directory.
 * @param {string} homeDir - Home directory.
 * @returns {void}
 */
export function syncAllHooks(gumDir, homeDir) {
  const config = readConfig(gumDir);
  const reg = readRegistry(gumDir);

  // Clear all GUM hooks first
  for (const runtimeId of config.runtimes) {
    const settingsPath = getSettingsPath(runtimeId, homeDir);
    if (!settingsPath || !fs.existsSync(settingsPath)) continue;
    const settings = readJSON(settingsPath);
    if (settings.hooks) {
      for (const [event, entries] of Object.entries(settings.hooks)) {
        settings.hooks[event] = entries.filter(e => !e._gum_module);
        if (settings.hooks[event].length === 0) delete settings.hooks[event];
      }
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    }
  }

  // Re-add hooks from all modules with hooks.json
  for (const [name, modPath] of Object.entries(reg.modules)) {
    if (!fs.existsSync(modPath)) continue;
    const hooksPath = path.join(modPath, 'hooks.json');
    if (!fs.existsSync(hooksPath)) continue;
    const moduleHooks = readJSON(hooksPath);
    syncHooksToRuntime(name, moduleHooks, config.runtimes, gumDir, homeDir);
  }
}
