import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { readRegistry, addModule } from './registry.js';
import { readModuleManifest } from './modules.js';

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
    hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));
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

export function importModule(filePath, storagePath, gumDir) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const { module: mod, rules, hooks } = data;

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
