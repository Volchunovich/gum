/**
 * Config — GUM configuration file read/write
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import YAML from 'yaml';

export const CONFIG_DEFAULTS = {
  runtimes: [],
  storage: '',
};

/**
 * Return the default GUM config directory (~/.gum).
 * @returns {string} Absolute path to the GUM config directory.
 */
export function getGumDir() {
  return path.join(os.homedir(), '.gum');
}

/**
 * Read the GUM config file, merging with defaults.
 * @param {string} [gumDir] - GUM config directory.
 * @returns {{ runtimes: string[], storage: string }} Config object.
 */
export function readConfig(gumDir = getGumDir()) {
  const configPath = path.join(gumDir, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    return { ...CONFIG_DEFAULTS };
  }
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return { ...CONFIG_DEFAULTS, ...YAML.parse(content) };
  } catch (e) {
    throw new Error(`Failed to parse config.yaml: ${e.message}`);
  }
}

/**
 * Write the GUM config to disk.
 * @param {{ runtimes: string[], storage: string }} config - Config to write.
 * @param {string} [gumDir] - GUM config directory.
 * @returns {void}
 */
export function writeConfig(config, gumDir = getGumDir()) {
  fs.mkdirSync(gumDir, { recursive: true });
  const configPath = path.join(gumDir, 'config.yaml');
  fs.writeFileSync(configPath, YAML.stringify(config), 'utf-8');
}
