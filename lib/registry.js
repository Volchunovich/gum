/**
 * Registry — Module path registry management
 */
import fs from 'fs';
import path from 'path';
import { getGumDir } from './config.js';
import { readJSON } from './utils.js';

const REGISTRY_DEFAULTS = { storage: '', modules: {} };

/**
 * Read the GUM registry from disk.
 * @param {string} [gumDir] - GUM config directory.
 * @returns {{ storage: string, modules: Record<string, string> }} Registry object.
 */
export function readRegistry(gumDir = getGumDir()) {
  const regPath = path.join(gumDir, 'registry.json');
  if (!fs.existsSync(regPath)) {
    return { ...REGISTRY_DEFAULTS, modules: {} };
  }
  return readJSON(regPath);
}

/**
 * Persist the registry to disk.
 * @param {{ storage: string, modules: Record<string, string> }} registry - Registry to write.
 * @param {string} [gumDir] - GUM config directory.
 * @returns {void}
 */
export function writeRegistry(registry, gumDir = getGumDir()) {
  fs.mkdirSync(gumDir, { recursive: true });
  const regPath = path.join(gumDir, 'registry.json');
  fs.writeFileSync(regPath, JSON.stringify(registry, null, 2), 'utf-8');
}

/**
 * Register a module path in the registry.
 * @param {string} name - Module name.
 * @param {string} modulePath - Absolute path to the module directory.
 * @param {string} [gumDir] - GUM config directory.
 * @returns {void}
 */
export function addModule(name, modulePath, gumDir = getGumDir()) {
  const reg = readRegistry(gumDir);
  reg.modules[name] = modulePath;
  writeRegistry(reg, gumDir);
}

/**
 * Remove a module entry from the registry.
 * @param {string} name - Module name to remove.
 * @param {string} [gumDir] - GUM config directory.
 * @returns {void}
 */
export function removeModule(name, gumDir = getGumDir()) {
  const reg = readRegistry(gumDir);
  delete reg.modules[name];
  writeRegistry(reg, gumDir);
}

/**
 * Get the filesystem path for a registered module.
 * @param {string} name - Module name.
 * @param {string} [gumDir] - GUM config directory.
 * @returns {string|null} Absolute path or null if not registered.
 */
export function getModulePath(name, gumDir = getGumDir()) {
  const reg = readRegistry(gumDir);
  return reg.modules[name] || null;
}
