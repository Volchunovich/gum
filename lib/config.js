import fs from 'fs';
import path from 'path';
import os from 'os';
import YAML from 'yaml';

export const CONFIG_DEFAULTS = {
  runtimes: [],
  storage: '',
};

export function getGumDir() {
  return path.join(os.homedir(), '.gum');
}

export function readConfig(gumDir = getGumDir()) {
  const configPath = path.join(gumDir, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    return { ...CONFIG_DEFAULTS };
  }
  const content = fs.readFileSync(configPath, 'utf-8');
  return YAML.parse(content);
}

export function writeConfig(config, gumDir = getGumDir()) {
  fs.mkdirSync(gumDir, { recursive: true });
  const configPath = path.join(gumDir, 'config.yaml');
  fs.writeFileSync(configPath, YAML.stringify(config), 'utf-8');
}
