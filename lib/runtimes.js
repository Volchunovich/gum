// lib/runtimes.js
import fs from 'fs';
import path from 'path';
import os from 'os';

export const RUNTIMES = [
  { id: 'claude', name: 'Claude Code', rulesDir: '.claude/rules', settingsFile: '.claude/settings.json' },
  { id: 'gemini', name: 'Gemini CLI', rulesDir: '.gemini/rules', settingsFile: '.gemini/settings.json' },
  { id: 'copilot', name: 'GitHub Copilot', rulesDir: '.github', settingsFile: null },
  { id: 'cursor', name: 'Cursor', rulesDir: '.cursor/rules', settingsFile: '.cursor/hooks.json' },
  { id: 'windsurf', name: 'Windsurf', rulesDir: '.windsurf/rules', settingsFile: null },
];

export function getRuntime(id) {
  return RUNTIMES.find(r => r.id === id);
}

export function getRulesPath(runtimeId, homeDir = os.homedir()) {
  const runtime = getRuntime(runtimeId);
  return path.join(homeDir, runtime.rulesDir, 'gum.md');
}

export function getSettingsPath(runtimeId, homeDir = os.homedir()) {
  const runtime = getRuntime(runtimeId);
  if (!runtime.settingsFile) return null;
  return path.join(homeDir, runtime.settingsFile);
}

const INTEGRATION_TEMPLATE = `# GUM — Globally Unified Modules
At the start of every session, read the file ~/.gum/registry.json.
For each registered module, read its module.yaml.
If enabled: true, read the module's rules.md and follow all instructions within.
Check for .gum.json in the current project for team overrides.
Check for .gum.local.json for personal overrides.
Priority: .gum.local.json > .gum.json > module.yaml (global default).

If a module's rules.md references a skill that is not available in the current
session, inform the user clearly:

⚠️ Module "<module-name>" references skill "<skill-name>"
   which is not installed. Run /gum-edit <module-name> to update,
   or install the missing skill.

Continue following all other rules from the module normally.
`;

export function writeIntegrationFile(runtimeId, homeDir = os.homedir()) {
  const rulesPath = getRulesPath(runtimeId, homeDir);
  fs.mkdirSync(path.dirname(rulesPath), { recursive: true });
  fs.writeFileSync(rulesPath, INTEGRATION_TEMPLATE, 'utf-8');
}
