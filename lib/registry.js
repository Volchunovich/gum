import fs from 'fs';
import path from 'path';
import { getGumDir } from './config.js';

const REGISTRY_DEFAULTS = { storage: '', modules: {} };

export function readRegistry(gumDir = getGumDir()) {
  const regPath = path.join(gumDir, 'registry.json');
  if (!fs.existsSync(regPath)) {
    return { ...REGISTRY_DEFAULTS, modules: {} };
  }
  return JSON.parse(fs.readFileSync(regPath, 'utf-8'));
}

export function writeRegistry(registry, gumDir = getGumDir()) {
  fs.mkdirSync(gumDir, { recursive: true });
  const regPath = path.join(gumDir, 'registry.json');
  fs.writeFileSync(regPath, JSON.stringify(registry, null, 2), 'utf-8');
}

export function addModule(name, modulePath, gumDir = getGumDir()) {
  const reg = readRegistry(gumDir);
  reg.modules[name] = modulePath;
  writeRegistry(reg, gumDir);
}

export function removeModule(name, gumDir = getGumDir()) {
  const reg = readRegistry(gumDir);
  delete reg.modules[name];
  writeRegistry(reg, gumDir);
}

export function getModulePath(name, gumDir = getGumDir()) {
  const reg = readRegistry(gumDir);
  return reg.modules[name] || null;
}
