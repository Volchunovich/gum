/**
 * Modules — Module CRUD and override resolution
 */
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { readRegistry, addModule, removeModule } from './registry.js';
import { readJSON, validateModuleName } from './utils.js';

/**
 * Create a new module directory with a manifest and empty rules file.
 * @param {string} name - Module name (must be a safe single path segment).
 * @param {string} description - Human-readable description.
 * @param {string} storagePath - Directory in which to create the module folder.
 * @param {string} gumDir - GUM config directory.
 * @returns {string} Absolute path to the created module directory.
 */
export function createModule(name, description, storagePath, gumDir) {
  validateModuleName(name);
  const modDir = path.join(storagePath, name);
  fs.mkdirSync(modDir, { recursive: true });

  const manifest = { name, description, version: '1.0.0', enabled: true };
  fs.writeFileSync(path.join(modDir, 'module.yaml'), YAML.stringify(manifest), 'utf-8');
  fs.writeFileSync(path.join(modDir, 'rules.md'), `# ${name}\n\n`, 'utf-8');

  addModule(name, modDir, gumDir);
  return modDir;
}

/**
 * Read and parse a module's YAML manifest.
 * @param {string} modPath - Absolute path to the module directory.
 * @returns {{ name: string, description: string, version: string, enabled: boolean }} Manifest object.
 */
export function readModuleManifest(modPath) {
  try {
    const content = fs.readFileSync(path.join(modPath, 'module.yaml'), 'utf-8');
    return YAML.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse module.yaml in ${modPath}: ${e.message}`);
  }
}

/**
 * Write a module's manifest to disk.
 * @param {string} modPath - Absolute path to the module directory.
 * @param {{ name: string, description: string, version: string, enabled: boolean }} manifest - Manifest to write.
 * @returns {void}
 */
export function writeModuleManifest(modPath, manifest) {
  fs.writeFileSync(path.join(modPath, 'module.yaml'), YAML.stringify(manifest), 'utf-8');
}

/**
 * Enable or disable a module by updating its manifest.
 * @param {string} modPath - Absolute path to the module directory.
 * @param {boolean} enabled - Whether the module should be enabled.
 * @returns {void}
 */
export function toggleModule(modPath, enabled) {
  const manifest = readModuleManifest(modPath);
  manifest.enabled = enabled;
  writeModuleManifest(modPath, manifest);
}

/**
 * Delete a module's directory and remove it from the registry.
 * NOTE: Hook cleanup must be performed by the caller before calling this function.
 * Use removeHooksFromRuntime() for each relevant runtime prior to deletion.
 * @param {string} name - Module name.
 * @param {string} gumDir - GUM config directory.
 * @returns {void}
 */
export function deleteModule(name, gumDir) {
  const reg = readRegistry(gumDir);
  const modPath = reg.modules[name];
  if (modPath && fs.existsSync(modPath)) {
    fs.rmSync(modPath, { recursive: true, force: true });
  }
  removeModule(name, gumDir);
}

/**
 * List all modules registered in the registry that still exist on disk.
 * Modules with a corrupt or missing manifest are skipped with a warning.
 * @param {string} gumDir - GUM config directory.
 * @returns {{ name: string, path: string, enabled: boolean, description: string, hasHooks: boolean }[]}
 */
export function listModules(gumDir) {
  const reg = readRegistry(gumDir);
  const result = [];
  for (const [name, modPath] of Object.entries(reg.modules)) {
    if (!fs.existsSync(modPath)) continue;
    let manifest;
    try {
      manifest = readModuleManifest(modPath);
    } catch (e) {
      console.warn(`Warning: skipping module "${name}" — ${e.message}`);
      continue;
    }
    const hasHooks = fs.existsSync(path.join(modPath, 'hooks.json'));
    result.push({ name, path: modPath, enabled: manifest.enabled, description: manifest.description, hasHooks });
  }
  return result;
}

/**
 * Return the list of enabled modules, optionally applying per-project overrides
 * from .gum.json (team) and .gum.local.json (personal).
 * @param {string} gumDir - GUM config directory.
 * @param {string|null} [projectDir] - Project directory to check for override files.
 * @returns {{ name: string, path: string, enabled: boolean, description: string, hasHooks: boolean }[]}
 */
export function resolveEnabledModules(gumDir, projectDir = null) {
  const all = listModules(gumDir);
  if (!projectDir) return all.filter(m => m.enabled);

  let overrides = {};
  const teamFile = path.join(projectDir, '.gum.json');
  if (fs.existsSync(teamFile)) {
    const team = readJSON(teamFile);
    overrides = { ...overrides, ...(team.overrides || {}) };
  }
  const personalFile = path.join(projectDir, '.gum.local.json');
  if (fs.existsSync(personalFile)) {
    const personal = readJSON(personalFile);
    overrides = { ...overrides, ...(personal.overrides || {}) };
  }

  return all.filter(m => {
    if (overrides[m.name] !== undefined) return overrides[m.name];
    return m.enabled;
  });
}
