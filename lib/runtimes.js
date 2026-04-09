/**
 * Runtimes — AI runtime definitions and integration files
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

export const RUNTIMES = [
  { id: 'claude', name: 'Claude Code', rulesDir: '.claude/rules', settingsFile: '.claude/settings.json' },
  { id: 'gemini', name: 'Gemini CLI', rulesDir: '.gemini/rules', settingsFile: '.gemini/settings.json' },
  { id: 'copilot', name: 'GitHub Copilot', rulesDir: '.github', settingsFile: null },
  { id: 'cursor', name: 'Cursor', rulesDir: '.cursor/rules', settingsFile: '.cursor/hooks.json' },
  { id: 'windsurf', name: 'Windsurf', rulesDir: '.windsurf/rules', settingsFile: null },
  { id: 'opencode', name: 'OpenCode', rulesDir: '.opencode/rules', settingsFile: '.opencode/settings.json' },
  { id: 'kilo', name: 'Kilo Code', rulesDir: '.config/kilo/rules', settingsFile: null },
  { id: 'codex', name: 'Codex', rulesDir: '.codex/rules', settingsFile: '.codex/settings.json' },
  { id: 'antigravity', name: 'Antigravity', rulesDir: '.gemini/antigravity/rules', settingsFile: null },
  { id: 'augment', name: 'Augment', rulesDir: '.augment/rules', settingsFile: null },
  { id: 'trae', name: 'Trae', rulesDir: '.trae/rules', settingsFile: null },
];

/**
 * Look up a runtime definition by ID.
 * @param {string} id - Runtime identifier (e.g. 'claude', 'gemini').
 * @returns {{ id: string, name: string, rulesDir: string, settingsFile: string|null }} Runtime definition.
 * @throws {Error} If the runtime ID is not recognised.
 */
export function getRuntime(id) {
  const runtime = RUNTIMES.find(r => r.id === id);
  if (!runtime) {
    throw new Error(`Unknown runtime: "${id}"`);
  }
  return runtime;
}

/**
 * Get the absolute path to the GUM integration rules file for a runtime.
 * @param {string} runtimeId - Runtime identifier.
 * @param {string} [homeDir] - Home directory override.
 * @returns {string} Absolute path.
 */
export function getRulesPath(runtimeId, homeDir = os.homedir()) {
  const runtime = getRuntime(runtimeId);
  return path.join(homeDir, runtime.rulesDir, 'gum.md');
}

/**
 * Get the absolute path to the GUM modules rules subdirectory for a runtime.
 * Enabled module rules are copied here by `gum sync`.
 * @param {string} runtimeId - Runtime identifier.
 * @param {string} [homeDir] - Home directory override.
 * @returns {string} Absolute path to the gum subdirectory (e.g. ~/.claude/rules/gum/).
 */
export function getModulesRulesDir(runtimeId, homeDir = os.homedir()) {
  const runtime = getRuntime(runtimeId);
  return path.join(homeDir, runtime.rulesDir, 'gum');
}

/**
 * Get the absolute path to the settings file for a runtime, or null if the runtime
 * does not support hook-based settings.
 * @param {string} runtimeId - Runtime identifier.
 * @param {string} [homeDir] - Home directory override.
 * @returns {string|null} Absolute path, or null.
 */
export function getSettingsPath(runtimeId, homeDir = os.homedir()) {
  const runtime = getRuntime(runtimeId);
  if (!runtime.settingsFile) return null;
  return path.join(homeDir, runtime.settingsFile);
}

const INTEGRATION_TEMPLATE = `# GUM — Globally Unified Modules

GUM module rules are loaded automatically from this rules directory.
Each enabled module has its own file at:
  ~/.claude/rules/gum/<module-name>.md

No file reads are required at startup — rules are already present.

## Per-project overrides

At the start of each session, check the current project directory for override files:

1. Read \`.gum.json\` (team overrides) — this file is in the project directory, no permission issues.
2. Read \`.gum.local.json\` (personal overrides) — same directory.
3. Both files have the shape: \`{ "overrides": { "<module-name>": true|false } }\`
4. Priority: \`.gum.local.json\` > \`.gum.json\` > module default (from rules file).
5. If a module is disabled via override, ignore its rules for this session.

## Skill warnings

If a module's rules reference a skill that is not available in the current session,
inform the user clearly:

⚠️ Module "<module-name>" references skill "<skill-name>"
   which is not installed. Run /gum-edit <module-name> to update,
   or install the missing skill.

Continue following all other rules from the module normally.
`;

/**
 * Write the GUM integration rules file for a runtime.
 * @param {string} runtimeId - Runtime identifier.
 * @param {string} [homeDir] - Home directory override.
 * @returns {void}
 */
export function writeIntegrationFile(runtimeId, homeDir = os.homedir()) {
  const rulesPath = getRulesPath(runtimeId, homeDir);
  fs.mkdirSync(path.dirname(rulesPath), { recursive: true });
  fs.writeFileSync(rulesPath, INTEGRATION_TEMPLATE, 'utf-8');
}
