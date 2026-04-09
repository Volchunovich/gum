import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { readRegistry, addModule, removeModule } from './registry.js';

export function createModule(name, description, storagePath, gumDir) {
  const modDir = path.join(storagePath, name);
  fs.mkdirSync(modDir, { recursive: true });

  const manifest = { name, description, version: '1.0.0', enabled: true };
  fs.writeFileSync(path.join(modDir, 'module.yaml'), YAML.stringify(manifest), 'utf-8');
  fs.writeFileSync(path.join(modDir, 'rules.md'), `# ${name}\n\n`, 'utf-8');

  addModule(name, modDir, gumDir);
  return modDir;
}

export function readModuleManifest(modPath) {
  const content = fs.readFileSync(path.join(modPath, 'module.yaml'), 'utf-8');
  return YAML.parse(content);
}

export function writeModuleManifest(modPath, manifest) {
  fs.writeFileSync(path.join(modPath, 'module.yaml'), YAML.stringify(manifest), 'utf-8');
}

export function toggleModule(modPath, enabled) {
  const manifest = readModuleManifest(modPath);
  manifest.enabled = enabled;
  writeModuleManifest(modPath, manifest);
}

export function deleteModule(name, gumDir) {
  const reg = readRegistry(gumDir);
  const modPath = reg.modules[name];
  if (modPath && fs.existsSync(modPath)) {
    fs.rmSync(modPath, { recursive: true, force: true });
  }
  removeModule(name, gumDir);
}

export function listModules(gumDir) {
  const reg = readRegistry(gumDir);
  const result = [];
  for (const [name, modPath] of Object.entries(reg.modules)) {
    if (!fs.existsSync(modPath)) continue;
    const manifest = readModuleManifest(modPath);
    const hasHooks = fs.existsSync(path.join(modPath, 'hooks.json'));
    result.push({ name, path: modPath, enabled: manifest.enabled, description: manifest.description, hasHooks });
  }
  return result;
}

export function resolveEnabledModules(gumDir, projectDir = null) {
  const all = listModules(gumDir);
  if (!projectDir) return all.filter(m => m.enabled);

  let overrides = {};
  const teamFile = path.join(projectDir, '.gum.json');
  if (fs.existsSync(teamFile)) {
    const team = JSON.parse(fs.readFileSync(teamFile, 'utf-8'));
    overrides = { ...overrides, ...(team.overrides || {}) };
  }
  const personalFile = path.join(projectDir, '.gum.local.json');
  if (fs.existsSync(personalFile)) {
    const personal = JSON.parse(fs.readFileSync(personalFile, 'utf-8'));
    overrides = { ...overrides, ...(personal.overrides || {}) };
  }

  return all.filter(m => {
    if (overrides[m.name] !== undefined) return overrides[m.name];
    return m.enabled;
  });
}
