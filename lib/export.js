/**
 * Export — Module import/export as .gum.json bundles
 */
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { readRegistry, addModule } from './registry.js';
import { readModuleManifest } from './modules.js';
import { readJSON, validateModuleName } from './utils.js';

/**
 * Export a module to a portable .gum.json bundle file.
 * @param {string} moduleName - Name of the module to export.
 * @param {string} outputPath - Destination file path for the exported bundle.
 * @param {string} gumDir - GUM config directory.
 * @returns {void}
 */
export function exportModule(moduleName, outputPath, gumDir) {
  const reg = readRegistry(gumDir);
  const modPath = reg.modules[moduleName];
  if (!modPath || !fs.existsSync(modPath)) {
    throw new Error(`Module "${moduleName}" not found`);
  }

  const manifest = readModuleManifest(modPath);
  const rules = fs.readFileSync(path.join(modPath, 'rules.md'), 'utf-8');

  let hooks = {};
  const hooksPath = path.join(modPath, 'hooks.json');
  if (fs.existsSync(hooksPath)) {
    hooks = readJSON(hooksPath);
  }

  const exportData = {
    gum_version: '1.0.0',
    module: {
      name: manifest.name,
      description: manifest.description,
      version: manifest.version,
    },
    rules,
    hooks,
  };

  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
}

/**
 * Import a module from a .gum.json bundle file.
 * @param {string} filePath - Path to the .gum.json file to import.
 * @param {string} storagePath - Directory in which to create the module folder.
 * @param {string} gumDir - GUM config directory.
 * @returns {void}
 */
export function importModule(filePath, storagePath, gumDir) {
  const data = readJSON(filePath);

  if (!data.module?.name || typeof data.module.name !== 'string') {
    throw new Error('Invalid bundle: missing or invalid module.name');
  }
  if (typeof data.rules !== 'string') {
    throw new Error('Invalid bundle: rules must be a string');
  }

  const { module: mod, rules, hooks } = data;

  validateModuleName(mod.name);

  const modDir = path.join(storagePath, mod.name);
  fs.mkdirSync(modDir, { recursive: true });

  const manifest = {
    name: mod.name,
    description: mod.description,
    version: mod.version,
    enabled: true,
  };

  fs.writeFileSync(path.join(modDir, 'module.yaml'), YAML.stringify(manifest), 'utf-8');
  fs.writeFileSync(path.join(modDir, 'rules.md'), rules, 'utf-8');

  if (hooks && Object.keys(hooks).length > 0) {
    fs.writeFileSync(path.join(modDir, 'hooks.json'), JSON.stringify(hooks, null, 2), 'utf-8');
  }

  addModule(mod.name, modDir, gumDir);
}
