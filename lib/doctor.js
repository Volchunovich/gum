/**
 * Doctor — Health checks and auto-repair
 */
import fs from 'fs';
import path from 'path';
import { readRegistry, writeRegistry } from './registry.js';

/** Maximum recommended total rules lines across all modules. */
export const BUDGET_LIMIT = 150;

/**
 * Run a health check on the GUM installation.
 * @param {string} gumDir - GUM config directory.
 * @returns {{ healthy: boolean, issues: object[], budget: { total: number, perModule: Record<string, number>, overBudget: boolean } }}
 */
export function runDoctor(gumDir) {
  const issues = [];
  let budget = { total: 0, perModule: {}, overBudget: false };

  const regPath = path.join(gumDir, 'registry.json');
  if (!fs.existsSync(regPath)) {
    issues.push({ type: 'missing_registry', message: 'registry.json not found' });
    return { healthy: false, issues, budget };
  }

  const reg = readRegistry(gumDir);

  for (const [name, modPath] of Object.entries(reg.modules)) {
    if (!fs.existsSync(modPath)) {
      issues.push({
        type: 'orphaned_entry',
        module: name,
        message: `Module "${name}" path does not exist: ${modPath}`,
        fix: `npx get-gum doctor --repair`,
      });
      continue;
    }

    const rulesPath = path.join(modPath, 'rules.md');
    if (fs.existsSync(rulesPath)) {
      const content = fs.readFileSync(rulesPath, 'utf-8');
      const lines = content.endsWith('\n')
        ? content.split('\n').length - 1
        : content.split('\n').length;
      budget.perModule[name] = lines;
      budget.total += lines;
    }
  }

  budget.overBudget = budget.total > BUDGET_LIMIT;
  if (budget.overBudget) {
    issues.push({
      type: 'over_budget',
      message: `Total rules: ${budget.total} lines (recommended: <${BUDGET_LIMIT}). Use /gum-optimize to reduce.`,
    });
  }

  return { healthy: issues.length === 0, issues, budget };
}

/**
 * Remove orphaned module entries (paths that no longer exist) from the registry.
 * @param {string} gumDir - GUM config directory.
 * @returns {{ removed: string[] }} Names of the removed entries.
 */
export function repairDoctor(gumDir) {
  const reg = readRegistry(gumDir);
  const removed = [];

  for (const [name, modPath] of Object.entries(reg.modules)) {
    if (!fs.existsSync(modPath)) {
      delete reg.modules[name];
      removed.push(name);
    }
  }

  if (removed.length > 0) {
    writeRegistry(reg, gumDir);
  }

  return { removed };
}
