#!/usr/bin/env node
/**
 * CLI — Command-line interface for GUM module management
 */
import { Command } from "commander";
import fs from "fs";
import path from "path";
import os from "os";
import { listModules } from "../lib/modules.js";
import { runDoctor, repairDoctor, BUDGET_LIMIT } from "../lib/doctor.js";
import { exportModule, importModule } from "../lib/export.js";
import { readConfig, getGumDir } from "../lib/config.js";
import { readRegistry } from "../lib/registry.js";
import {
  syncAllHooks,
  removeHooksFromRuntime,
  readHooksManifest,
} from "../lib/hooks.js";
import { getRulesPath, writeIntegrationFile } from "../lib/runtimes.js";

const program = new Command();

program
  .name("get-gum")
  .description("GUM — Globally Unified Modules")
  .version("1.0.0");

function resolveGumDir(opts) {
  return opts.gumDir || getGumDir();
}

program
  .command("list")
  .description("Show all modules with status")
  .option("--gum-dir <path>", "GUM config directory")
  .action((opts) => {
    try {
      const gumDir = resolveGumDir(opts);
      const mods = listModules(gumDir);
      if (mods.length === 0) {
        console.log("No modules found.");
        return;
      }
      for (const m of mods) {
        const status = m.enabled ? "✅ enabled" : "❌ disabled";
        const hooks = m.hasHooks ? "rules + hooks" : "rules";
        console.log(`  ${m.name.padEnd(25)} ${status.padEnd(15)} ${hooks}`);
      }
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  });

program
  .command("doctor")
  .description("Health check")
  .option("--repair", "Auto-fix issues")
  .option("--gum-dir <path>", "GUM config directory")
  .action((opts) => {
    try {
      const gumDir = resolveGumDir(opts);
      if (opts.repair) {
        const result = repairDoctor(gumDir);
        if (result.removed.length > 0) {
          console.log(`Removed orphaned entries: ${result.removed.join(", ")}`);
        } else {
          console.log("Nothing to repair.");
        }
        return;
      }
      const report = runDoctor(gumDir);
      console.log(
        `\nContext Budget: ${report.budget.total}/${BUDGET_LIMIT} lines ${report.budget.overBudget ? "❌" : "✅"}`,
      );
      if (report.issues.length === 0) {
        console.log("Status: healthy ✅\n");
      } else {
        for (const issue of report.issues) {
          console.log(`⚠️  ${issue.message}`);
          if (issue.fix) console.log(`   Fix: ${issue.fix}`);
        }
      }
      console.log("\n💡 For rule quality analysis use /gum-optimize in chat.");
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  });

program
  .command("export <module>")
  .description("Export module to .gum.json")
  .option("--output <path>", "Output file path")
  .option("--gum-dir <path>", "GUM config directory")
  .action((moduleName, opts) => {
    try {
      const gumDir = resolveGumDir(opts);
      const output = opts.output || `${moduleName}.gum.json`;
      exportModule(moduleName, output, gumDir);
      console.log(`Exported to ${output}`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  });

program
  .command("import <file>")
  .description("Import module from .gum.json file")
  .option("--gum-dir <path>", "GUM config directory")
  .action((file, opts) => {
    try {
      const gumDir = resolveGumDir(opts);
      const config = readConfig(gumDir);
      importModule(file, config.storage, gumDir);
      console.log(`Module imported successfully.`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  });

program
  .command("sync")
  .description("Resync integration files and hooks")
  .option("--gum-dir <path>", "GUM config directory")
  .option("--home <path>", "Home directory override")
  .action((opts) => {
    try {
      const gumDir = resolveGumDir(opts);
      const homeDir = opts.home || os.homedir();
      syncAllHooks(gumDir, homeDir);
      console.log("Sync complete ✅");
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  });

program
  .command("toggle")
  .description("Enable/disable modules")
  .option("--local", "Save to .gum.json (team)")
  .option("--personal", "Save to .gum.local.json (personal)")
  .option("--module <name>", "Module name (non-interactive)")
  .option("--enable", "Enable the module")
  .option("--disable", "Disable the module")
  .option("--gum-dir <path>", "GUM config directory")
  .option("--project-dir <path>", "Project directory")
  .action(async (opts) => {
    try {
      const gumDir = resolveGumDir(opts);

      if (opts.module && (opts.enable || opts.disable)) {
        const enabled = !!opts.enable;

        if (opts.local || opts.personal) {
          const projDir = opts.projectDir || process.cwd();
          const filename = opts.personal ? ".gum.local.json" : ".gum.json";
          const filePath = path.join(projDir, filename);
          let data = { overrides: {} };
          if (fs.existsSync(filePath)) {
            const { readJSON } = await import("../lib/utils.js");
            data = readJSON(filePath);
            if (!data.overrides) data.overrides = {};
          }
          data.overrides[opts.module] = enabled;
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
          console.log(`Updated ${filename}: ${opts.module} = ${enabled}`);
        } else {
          const reg = readRegistry(gumDir);
          const modPath = reg.modules[opts.module];
          if (!modPath) {
            console.error(`Module "${opts.module}" not found`);
            process.exit(1);
          }
          const { toggleModule } = await import("../lib/modules.js");
          toggleModule(modPath, enabled);
          console.log(
            `${opts.module} ${enabled ? "enabled" : "disabled"} globally`,
          );
        }
        return;
      }

      const { checkbox } = await import("@inquirer/prompts");
      const mods = listModules(gumDir);
      if (mods.length === 0) {
        console.log("No modules found.");
        return;
      }
      const choices = mods.map((m) => ({
        name: `${m.name} — ${m.description || ""}`,
        value: m.name,
        checked: m.enabled,
      }));
      const selected = await checkbox({
        message: "Toggle modules (space = toggle, enter = save):",
        choices,
      });
      let changes = 0;
      for (const m of mods) {
        const shouldBeEnabled = selected.includes(m.name);
        if (m.enabled !== shouldBeEnabled) {
          const { toggleModule } = await import("../lib/modules.js");
          toggleModule(m.path, shouldBeEnabled);
          console.log(
            `  ${shouldBeEnabled ? "✅" : "❌"} ${m.name}: ${shouldBeEnabled ? "enabled" : "disabled"}`,
          );
          changes++;
        }
      }
      if (changes === 0) {
        console.log("  No changes.");
      }
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  });

program
  .command("remove")
  .description("Remove a module")
  .option("--module <name>", "Module name (non-interactive)")
  .option("--gum-dir <path>", "GUM config directory")
  .option("--home <path>", "Home directory override")
  .action(async (opts) => {
    try {
      const gumDir = resolveGumDir(opts);
      const homeDir = opts.home || os.homedir();

      if (opts.module) {
        const config = readConfig(gumDir);
        removeHooksFromRuntime(
          opts.module,
          config.runtimes || [],
          gumDir,
          homeDir,
        );
        const { deleteModule } = await import("../lib/modules.js");
        deleteModule(opts.module, gumDir);
        console.log(`Removed ${opts.module}`);
        return;
      }

      const { select } = await import("@inquirer/prompts");
      const mods = listModules(gumDir);
      if (mods.length === 0) {
        console.log("No modules found.");
        return;
      }
      const moduleName = await select({
        message: "Select module to remove:",
        choices: mods.map((m) => ({ name: m.name, value: m.name })),
      });
      const config = readConfig(gumDir);
      removeHooksFromRuntime(
        moduleName,
        config.runtimes || [],
        gumDir,
        homeDir,
      );
      const { deleteModule } = await import("../lib/modules.js");
      deleteModule(moduleName, gumDir);
      console.log(`Removed ${moduleName}`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  });

program
  .command("update")
  .description("Update GUM skills in all installed runtimes")
  .option("--gum-dir <path>", "GUM config directory")
  .option("--home <path>", "Home directory override")
  .action(async (opts) => {
    try {
      const gumDir = resolveGumDir(opts);
      const homeDir = opts.home || os.homedir();
      const config = readConfig(gumDir);

      for (const runtimeId of config.runtimes || []) {
        writeIntegrationFile(runtimeId, homeDir);
        console.log(`Updated integration file for ${runtimeId}`);
      }

      syncAllHooks(gumDir, homeDir);
      console.log("GUM updated successfully.");
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  });

program
  .command("uninstall")
  .description("Remove GUM completely (keeps modules in storage)")
  .option("--yes", "Skip confirmation")
  .option("--gum-dir <path>", "GUM config directory")
  .option("--home <path>", "Home directory override")
  .action(async (opts) => {
    try {
      const gumDir = resolveGumDir(opts);
      const homeDir = opts.home || os.homedir();

      if (!opts.yes) {
        const { confirm } = await import("@inquirer/prompts");
        const ok = await confirm({
          message: "Uninstall GUM? (modules in storage will be kept)",
        });
        if (!ok) return;
      }

      const config = readConfig(gumDir);

      for (const runtimeId of config.runtimes || []) {
        const rulesPath = getRulesPath(runtimeId, homeDir);
        if (fs.existsSync(rulesPath)) fs.unlinkSync(rulesPath);
      }

      const manifest = readHooksManifest(gumDir);
      for (const moduleName of Object.keys(manifest)) {
        removeHooksFromRuntime(
          moduleName,
          config.runtimes || [],
          gumDir,
          homeDir,
        );
      }

      fs.rmSync(gumDir, { recursive: true, force: true });
      console.log("GUM uninstalled. Your modules in storage were not deleted.");
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  });

program.parse();
