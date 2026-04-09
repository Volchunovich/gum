#!/usr/bin/env node
/**
 * Installer — Interactive and non-interactive GUM setup
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createRequire } from 'module';
import { writeConfig, readConfig } from '../lib/config.js';
import { writeRegistry, readRegistry } from '../lib/registry.js';
import { RUNTIMES, writeIntegrationFile, getRulesPath } from '../lib/runtimes.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const args = process.argv.slice(2);

// Colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  white: '\x1b[37m',
};

const LOGO = `
${c.cyan}${c.bold}  ██████╗  ██╗   ██╗███╗   ███╗
  ██╔════╝ ██║   ██║████╗ ████║
  ██║  ███╗██║   ██║██╔████╔██║
  ██║   ██║██║   ██║██║╚██╔╝██║
  ╚██████╔╝╚██████╔╝██║ ╚═╝ ██║
   ╚═════╝  ╚═════╝ ╚═╝     ╚═╝${c.reset}

  ${c.bold}GUM${c.reset} ${c.dim}v${pkg.version}${c.reset}
  ${c.dim}Globally Unified Modules${c.reset}
  ${c.dim}Reusable AI agent behavior bundles${c.reset}
`;

function hasFlag(flag) {
  return args.includes(`--${flag}`) || (flag.length === 1 && args.includes(`-${flag}`));
}

function getFlagValue(flag) {
  const idx = args.indexOf(`--${flag}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

// --help / -h
if (hasFlag('help') || hasFlag('h')) {
  console.log(LOGO);
  console.log(`  ${c.bold}USAGE${c.reset}`);
  console.log(`    npx get-gum@latest [flags]\n`);
  console.log(`  ${c.bold}FLAGS${c.reset}`);
  console.log(`    ${c.cyan}--help, -h${c.reset}             Show this help message`);
  console.log(`    ${c.cyan}--claude${c.reset}               Install for Claude Code`);
  console.log(`    ${c.cyan}--gemini${c.reset}               Install for Gemini CLI`);
  console.log(`    ${c.cyan}--copilot${c.reset}              Install for GitHub Copilot`);
  console.log(`    ${c.cyan}--cursor${c.reset}               Install for Cursor`);
  console.log(`    ${c.cyan}--windsurf${c.reset}             Install for Windsurf`);
  console.log(`    ${c.cyan}--all${c.reset}                  Install for all runtimes at once`);
  console.log(`    ${c.cyan}--storage <path>${c.reset}       Module storage path`);
  console.log(`    ${c.cyan}--home <path>${c.reset}          Override home directory`);
  console.log(`    ${c.cyan}--config-dir <runtime>=<path>${c.reset}  Override config dir for a runtime`);
  console.log(`    ${c.cyan}--uninstall${c.reset}            Uninstall GUM (keeps modules in storage)`);
  console.log('');
  console.log(`  ${c.bold}ENVIRONMENT VARIABLES${c.reset}`);
  console.log(`    ${c.cyan}CLAUDE_CONFIG_DIR${c.reset}      Override Claude config directory`);
  console.log(`    ${c.cyan}GEMINI_CONFIG_DIR${c.reset}      Override Gemini config directory`);
  console.log(`    ${c.cyan}COPILOT_CONFIG_DIR${c.reset}     Override Copilot config directory`);
  console.log(`    ${c.cyan}CURSOR_CONFIG_DIR${c.reset}      Override Cursor config directory`);
  console.log(`    ${c.cyan}WINDSURF_CONFIG_DIR${c.reset}    Override Windsurf config directory`);
  console.log('');
  console.log(`  ${c.bold}EXAMPLES${c.reset}`);
  console.log(`    ${c.dim}# Interactive install${c.reset}`);
  console.log(`    npx get-gum@latest`);
  console.log('');
  console.log(`    ${c.dim}# Install for Claude only (non-interactive)${c.reset}`);
  console.log(`    npx get-gum@latest --claude --storage ~/my-modules`);
  console.log('');
  console.log(`    ${c.dim}# Install for all runtimes at once${c.reset}`);
  console.log(`    npx get-gum@latest --all --storage ~/my-modules`);
  console.log('');
  console.log(`    ${c.dim}# Install for multiple specific runtimes${c.reset}`);
  console.log(`    npx get-gum@latest --claude --gemini --storage ~/my-modules`);
  console.log('');
  console.log(`    ${c.dim}# Override config dir for a runtime${c.reset}`);
  console.log(`    npx get-gum@latest --claude --storage ~/my-modules --config-dir claude=/custom/path`);
  console.log('');
  console.log(`    ${c.dim}# Uninstall GUM${c.reset}`);
  console.log(`    npx get-gum --uninstall`);
  console.log('');
  process.exit(0);
}

// WSL detection — warn if Windows Node.js is running inside WSL
if (process.platform === 'win32') {
  let isWsl = false;
  if (process.env.WSL_DISTRO_NAME) {
    isWsl = true;
  } else {
    try {
      const procVersion = fs.readFileSync('/proc/version', 'utf-8');
      if (procVersion.toLowerCase().includes('microsoft')) isWsl = true;
    } catch {
      // /proc/version not readable — not WSL
    }
  }
  if (isWsl) {
    console.error(`
${c.yellow}⚠ Detected WSL with Windows-native Node.js.${c.reset}

This causes path resolution issues that prevent correct installation.
Please install a Linux-native Node.js inside WSL:

  curl -fsSL https://fnm.vercel.app/install | bash
  fnm install --lts

Then re-run: ${c.cyan}npx get-gum@latest${c.reset}
`);
    process.exit(1);
  }
}

// Parse --config-dir overrides: --config-dir claude=/custom/path
// Can be specified multiple times or as a single value
function parseConfigDirOverrides() {
  const overrides = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config-dir' && i + 1 < args.length) {
      const val = args[i + 1];
      const eqIdx = val.indexOf('=');
      if (eqIdx !== -1) {
        const runtimeId = val.slice(0, eqIdx).trim();
        const dirPath = val.slice(eqIdx + 1).trim();
        overrides[runtimeId] = dirPath;
      }
    }
  }
  return overrides;
}

// Get config dir for a runtime, respecting ENV vars and --config-dir overrides
function getRuntimeConfigDir(runtimeId, homeDir, configDirOverrides) {
  // 1. --config-dir flag has highest precedence
  if (configDirOverrides[runtimeId]) {
    return configDirOverrides[runtimeId];
  }
  // 2. Environment variables
  const envKey = `${runtimeId.toUpperCase()}_CONFIG_DIR`;
  if (process.env[envKey]) {
    return process.env[envKey];
  }
  // 3. Default: homeDir (runtimes.js appends the rulesDir relative to homeDir)
  return homeDir;
}

const homeDir = getFlagValue('home') || os.homedir();
const gumDir = path.join(homeDir, '.gum');
const storagePath = getFlagValue('storage');
const isNonInteractive = storagePath !== null;
const configDirOverrides = parseConfigDirOverrides();

async function runUninstall() {
  const { confirm } = await import('@inquirer/prompts');
  const ok = await confirm({ message: 'Uninstall GUM? (modules in storage will be kept)' });
  if (!ok) return;

  if (!fs.existsSync(path.join(gumDir, 'config.yaml'))) {
    console.log(`  ${c.yellow}No GUM installation found.${c.reset}`);
    return;
  }

  const config = readConfig(gumDir);
  for (const runtimeId of (config.runtimes || [])) {
    const effectiveHomeDir = getRuntimeConfigDir(runtimeId, homeDir, configDirOverrides);
    const rulesPath = getRulesPath(runtimeId, effectiveHomeDir);
    if (fs.existsSync(rulesPath)) {
      fs.unlinkSync(rulesPath);
      console.log(`  ${c.green}✓${c.reset} Removed integration for ${c.bold}${runtimeId}${c.reset}`);
    }
  }

  fs.rmSync(gumDir, { recursive: true, force: true });
  console.log(`\n  ${c.green}${c.bold}Done!${c.reset} GUM uninstalled. Your modules in storage were not deleted.\n`);
}

async function run() {
  console.log(LOGO);

  // --uninstall flag: run uninstall directly from installer
  if (hasFlag('uninstall')) {
    await runUninstall();
    return;
  }

  const configExists = fs.existsSync(path.join(gumDir, 'config.yaml'));

  let runtimes;
  let storage;

  if (configExists) {
    const existing = readConfig(gumDir);
    const moduleCount = fs.existsSync(path.join(gumDir, 'registry.json'))
      ? Object.keys(readRegistry(gumDir).modules || {}).length
      : 0;

    console.log(`  ${c.yellow}Found existing config${c.reset}`);
    console.log(`  ${c.dim}Storage:${c.reset}  ${existing.storage}`);
    console.log(`  ${c.dim}Runtimes:${c.reset} ${existing.runtimes.join(', ')}`);
    console.log(`  ${c.dim}Modules:${c.reset}  ${moduleCount}\n`);

    if (isNonInteractive) {
      runtimes = existing.runtimes;
      storage = existing.storage;
    } else {
      const { confirm } = await import('@inquirer/prompts');
      const restore = await confirm({ message: 'Restore this configuration?', default: true });
      if (restore) {
        runtimes = existing.runtimes;
        storage = existing.storage;
      }
    }
  }

  if (!runtimes || !storage) {
    if (isNonInteractive) {
      // --all installs every runtime
      if (hasFlag('all')) {
        runtimes = RUNTIMES.map(r => r.id);
      } else {
        runtimes = RUNTIMES.filter(r => hasFlag(r.id)).map(r => r.id);
        if (runtimes.length === 0) runtimes = ['claude'];
      }
      storage = storagePath;
    } else {
      const { checkbox, input } = await import('@inquirer/prompts');
      runtimes = await checkbox({
        message: 'Select runtimes:',
        choices: RUNTIMES.map(r => ({ name: r.name, value: r.id, checked: r.id === 'claude' })),
      });
      storage = await input({
        message: 'Module storage path (recommended: Obsidian vault):',
        default: path.join(homeDir, 'gum-modules'),
      });
    }
  }

  console.log('');

  fs.mkdirSync(storage, { recursive: true });
  writeConfig({ runtimes, storage }, gumDir);

  if (!fs.existsSync(path.join(gumDir, 'registry.json'))) {
    writeRegistry({ storage, modules: {} }, gumDir);
  }

  // Add GUM permissions to runtime settings (so skills can read/write ~/.gum/ without prompting)
  for (const runtimeId of runtimes) {
    if (runtimeId !== 'claude') continue; // Only Claude Code has settings.json permissions
    const effectiveHomeDir = getRuntimeConfigDir(runtimeId, homeDir, configDirOverrides);
    const settingsPath = path.join(effectiveHomeDir, '.claude', 'settings.json');
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      } catch {
        settings = {};
      }
    }
    if (!settings.permissions) settings.permissions = {};
    if (!Array.isArray(settings.permissions.allow)) settings.permissions.allow = [];

    const absoluteGumDir = path.resolve(gumDir);
    const absoluteStorage = path.resolve(storage);
    const gumPermissions = [
      `Read(${absoluteGumDir}/**)`,
      `Write(${absoluteGumDir}/**)`,
      `Read(${absoluteStorage}/**)`,
      `Write(${absoluteStorage}/**)`,
    ];

    let added = false;
    for (const perm of gumPermissions) {
      if (!settings.permissions.allow.includes(perm)) {
        settings.permissions.allow.push(perm);
        added = true;
      }
    }

    if (added) {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      console.log(`  ${c.green}✓${c.reset} Added GUM permissions to ${c.bold}Claude Code${c.reset} settings`);
    }
  }

  // Offer starter modules (skip if GUM is already installed)
  const startersSource = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'starters');
  if (!configExists && fs.existsSync(startersSource)) {
    const availableStarters = fs.readdirSync(startersSource).filter(
      d => fs.statSync(path.join(startersSource, d)).isDirectory()
    );
    if (availableStarters.length > 0) {
      let selectedStarters = [];
      if (isNonInteractive) {
        if (hasFlag('starters')) {
          selectedStarters = availableStarters;
        }
      } else {
        const { checkbox: starterCheckbox } = await import('@inquirer/prompts');
        const starterDescriptions = {};
        for (const name of availableStarters) {
          try {
            const yaml = (await import('yaml')).default;
            const manifest = yaml.parse(fs.readFileSync(path.join(startersSource, name, 'module.yaml'), 'utf-8'));
            starterDescriptions[name] = manifest.description || '';
          } catch {
            starterDescriptions[name] = '';
          }
        }
        selectedStarters = await starterCheckbox({
          message: 'Install starter modules? (recommended)',
          choices: availableStarters.map(name => ({
            name: `${name} — ${starterDescriptions[name]}`,
            value: name,
            checked: name !== 'thoughtful-dev',
          })),
        });
      }

      for (const starterName of selectedStarters) {
        const src = path.join(startersSource, starterName);
        const dest = path.join(storage, starterName);
        if (!fs.existsSync(dest)) {
          fs.cpSync(src, dest, { recursive: true });
          const { addModule } = await import('../lib/registry.js');
          addModule(starterName, dest, gumDir);
          console.log(`  ${c.green}✓${c.reset} Installed starter: ${c.bold}${starterName}${c.reset}`);
        }
      }
    }
  }

  for (const runtimeId of runtimes) {
    const effectiveHomeDir = getRuntimeConfigDir(runtimeId, homeDir, configDirOverrides);
    writeIntegrationFile(runtimeId, effectiveHomeDir);
    console.log(`  ${c.green}✓${c.reset} Installed integration for ${c.bold}${runtimeId}${c.reset}`);
  }

  // Copy skills to runtime directories
  const skillsSource = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'skills');
  if (fs.existsSync(skillsSource)) {
    for (const runtimeId of runtimes) {
      const runtime = RUNTIMES.find(r => r.id === runtimeId);
      // Use forward slashes then split for cross-platform compatibility
      const skillsTopDir = runtime.rulesDir.replace(/\\/g, '/').split('/')[0];
      const effectiveHomeDir = getRuntimeConfigDir(runtimeId, homeDir, configDirOverrides);
      const skillsDest = path.join(effectiveHomeDir, skillsTopDir, 'skills');
      fs.mkdirSync(skillsDest, { recursive: true });
      for (const skillDir of fs.readdirSync(skillsSource)) {
        const srcSkill = path.join(skillsSource, skillDir);
        if (!fs.statSync(srcSkill).isDirectory()) continue;
        const destSkill = path.join(skillsDest, skillDir);
        fs.cpSync(srcSkill, destSkill, { recursive: true });
      }
      console.log(`  ${c.green}✓${c.reset} Installed skills for ${c.bold}${runtimeId}${c.reset}`);
    }
  }

  console.log(`\n  ${c.green}${c.bold}Done!${c.reset} Run ${c.cyan}/gum-create${c.reset} to create your first module.\n`);
}

run().catch(console.error);
