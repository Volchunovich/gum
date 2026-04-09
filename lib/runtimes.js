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

MANDATORY INITIALIZATION — EXECUTE BEFORE YOUR FIRST RESPONSE:

1. Read ~/.gum/registry.json immediately.
2. For each registered module, read its module.yaml.
3. If enabled: true, read the module's rules.md.
4. FOLLOW ALL INSTRUCTIONS from every enabled module's rules.md starting from your VERY FIRST reply. Do NOT delay compliance until later messages.
5. Check for .gum.json in the current project for team overrides.
6. Check for .gum.local.json for personal overrides.
7. Priority: .gum.local.json > .gum.json > module.yaml (global default).

CRITICAL: Module rules apply to EVERY response including the first one. If a module says "start every reply with X", your first reply MUST start with X. No exceptions. No warm-up period.

If a module's rules.md references a skill that is not available in the current
session, inform the user clearly:

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
