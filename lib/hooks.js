/**
 * Hooks — Runtime hook sync with manifest tracking
 */
import fs from "fs";
import path from "path";
import { getSettingsPath, getModulesRulesDir, RUNTIMES } from "./runtimes.js";
import YAML from "yaml";
import { readConfig } from "./config.js";
import { readRegistry } from "./registry.js";
import { readJSON } from "./utils.js";

/**
 * Read the GUM hooks manifest from disk.
 * @param {string} gumDir - GUM config directory.
 * @returns {Record<string, Record<string, string[]>>} Hooks manifest keyed by module name.
 */
export function readHooksManifest(gumDir) {
  const manifestPath = path.join(gumDir, "hooks-manifest.json");
  if (!fs.existsSync(manifestPath)) return {};
  return readJSON(manifestPath);
}

function writeHooksManifest(manifest, gumDir) {
  const manifestPath = path.join(gumDir, "hooks-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
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
export function syncHooksToRuntime(
  moduleName,
  moduleHooks,
  runtimes,
  gumDir,
  homeDir,
) {
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
      settings.hooks[eventName] = entries.filter(
        (e) => e._gum_module !== moduleName,
      );
      if (settings.hooks[eventName].length === 0)
        delete settings.hooks[eventName];
    }

    manifest[moduleName][runtimeId] = [];

    for (const [eventName, entries] of Object.entries(runtimeHooks)) {
      if (!Array.isArray(entries)) continue; // skip malformed hook entries
      if (!settings.hooks[eventName]) settings.hooks[eventName] = [];
      for (const entry of entries) {
        const tagged = tagHookEntry(entry, moduleName);
        settings.hooks[eventName].push(tagged);
        manifest[moduleName][runtimeId].push(eventName);
      }
    }

    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
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
      settings.hooks[eventName] = entries.filter(
        (e) => e._gum_module !== moduleName,
      );
      if (settings.hooks[eventName].length === 0)
        delete settings.hooks[eventName];
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  }

  const manifest = readHooksManifest(gumDir);
  delete manifest[moduleName];
  writeHooksManifest(manifest, gumDir);
}

/**
 * Re-sync all module hooks to all configured runtimes.
 * Clears all GUM-managed hooks first, then re-adds from each module's hooks.json.
 * Also calls syncRulesToRuntime to keep rules files up to date.
 * @param {string} gumDir - GUM config directory.
 * @param {string} homeDir - Home directory.
 * @returns {void}
 */
export function syncAllHooks(gumDir, homeDir) {
  const config = readConfig(gumDir);
  const reg = readRegistry(gumDir);

  // Auto-discover modules in storage that aren't registered yet
  const storage = config.storage;
  if (storage && fs.existsSync(storage)) {
    let discovered = 0;
    for (const dir of fs.readdirSync(storage)) {
      const modDir = path.join(storage, dir);
      if (!fs.statSync(modDir).isDirectory()) continue;
      if (!fs.existsSync(path.join(modDir, "module.yaml"))) continue;
      if (!reg.modules[dir]) {
        reg.modules[dir] = modDir;
        discovered++;
      }
    }
    if (discovered > 0) {
      writeRegistry(reg, gumDir);
    }
  }

  // Clear all GUM hooks first
  for (const runtimeId of config.runtimes) {
    const settingsPath = getSettingsPath(runtimeId, homeDir);
    if (!settingsPath || !fs.existsSync(settingsPath)) continue;
    const settings = readJSON(settingsPath);
    if (settings.hooks) {
      for (const [event, entries] of Object.entries(settings.hooks)) {
        settings.hooks[event] = entries.filter((e) => !e._gum_module);
        if (settings.hooks[event].length === 0) delete settings.hooks[event];
      }
      fs.writeFileSync(
        settingsPath,
        JSON.stringify(settings, null, 2),
        "utf-8",
      );
    }
  }

  // Re-add hooks from all modules with hooks.json
  for (const [name, modPath] of Object.entries(reg.modules)) {
    if (!fs.existsSync(modPath)) continue;
    const hooksPath = path.join(modPath, "hooks.json");
    if (!fs.existsSync(hooksPath)) continue;
    const moduleHooks = readJSON(hooksPath);
    syncHooksToRuntime(name, moduleHooks, config.runtimes, gumDir, homeDir);
  }

  // Sync module rules files
  syncRulesToRuntime(gumDir, homeDir);
}

/**
 * Copy enabled module rules.md files into each runtime's gum rules subdirectory.
 * Removes rules files for disabled or unregistered modules.
 * @param {string} gumDir - GUM config directory.
 * @param {string} homeDir - Home directory.
 * @returns {void}
 */
export function syncRulesToRuntime(gumDir, homeDir) {
  const config = readConfig(gumDir);
  const reg = readRegistry(gumDir);

  // Determine which modules are enabled and have rules.md
  const enabledRules = {}; // name -> rules content
  for (const [name, modPath] of Object.entries(reg.modules)) {
    if (!fs.existsSync(modPath)) continue;
    const yamlPath = path.join(modPath, "module.yaml");
    if (!fs.existsSync(yamlPath)) continue;
    let manifest;
    try {
      manifest = YAML.parse(fs.readFileSync(yamlPath, "utf-8"));
    } catch {
      continue;
    }
    if (!manifest.enabled) continue;
    const rulesPath = path.join(modPath, "rules.md");
    if (!fs.existsSync(rulesPath)) continue;
    enabledRules[name] = fs.readFileSync(rulesPath, "utf-8");
  }

  for (const runtimeId of config.runtimes) {
    const rulesDir = getModulesRulesDir(runtimeId, homeDir);
    fs.mkdirSync(rulesDir, { recursive: true });

    // Write rules for enabled modules
    for (const [name, content] of Object.entries(enabledRules)) {
      fs.writeFileSync(path.join(rulesDir, `${name}.md`), content, "utf-8");
    }

    // Remove files for disabled/removed modules
    const existingFiles = fs
      .readdirSync(rulesDir)
      .filter((f) => f.endsWith(".md"));
    for (const file of existingFiles) {
      const moduleName = file.slice(0, -3); // strip .md
      if (!enabledRules[moduleName]) {
        fs.unlinkSync(path.join(rulesDir, file));
      }
    }
  }
}
