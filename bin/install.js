#!/usr/bin/env node
// bin/install.js
import fs from 'fs';
import path from 'path';
import os from 'os';
import { writeConfig, readConfig } from '../lib/config.js';
import { writeRegistry } from '../lib/registry.js';
import { RUNTIMES, writeIntegrationFile } from '../lib/runtimes.js';

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
  white: '\x1b[37m',
};

const LOGO = `
${c.cyan}${c.bold}  ██████╗  ██╗   ██╗███╗   ███╗
  ██╔════╝ ██║   ██║████╗ ████║
  ██║  ███╗██║   ██║██╔████╔██║
  ██║   ██║██║   ██║██║╚██╔╝██║
  ╚██████╔╝╚██████╔╝██║ ╚═╝ ██║
   ╚═════╝  ╚═════╝ ╚═╝     ╚═╝${c.reset}

  ${c.bold}GUM${c.reset} ${c.dim}v1.0.0${c.reset}
  ${c.dim}Globally Unified Modules${c.reset}
  ${c.dim}Reusable AI agent behavior bundles${c.reset}
`;

function hasFlag(flag) {
  return args.includes(`--${flag}`);
}

function getFlagValue(flag) {
  const idx = args.indexOf(`--${flag}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

const homeDir = getFlagValue('home') || os.homedir();
const gumDir = path.join(homeDir, '.gum');
const storagePath = getFlagValue('storage');
const isNonInteractive = storagePath !== null;

async function run() {
  console.log(LOGO);

  const configExists = fs.existsSync(path.join(gumDir, 'config.yaml'));

  let runtimes;
  let storage;

  if (configExists) {
    const existing = readConfig(gumDir);
    const moduleCount = fs.existsSync(path.join(gumDir, 'registry.json'))
      ? Object.keys(JSON.parse(fs.readFileSync(path.join(gumDir, 'registry.json'), 'utf-8')).modules || {}).length
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
      runtimes = RUNTIMES.filter(r => hasFlag(r.id)).map(r => r.id);
      storage = storagePath;
      if (runtimes.length === 0) runtimes = ['claude'];
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

  for (const runtimeId of runtimes) {
    writeIntegrationFile(runtimeId, homeDir);
    console.log(`  ${c.green}✓${c.reset} Installed integration for ${c.bold}${runtimeId}${c.reset}`);
  }

  // Copy skills to runtime directories
  const skillsSource = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'skills');
  if (fs.existsSync(skillsSource)) {
    for (const runtimeId of runtimes) {
      const runtime = RUNTIMES.find(r => r.id === runtimeId);
      const skillsDir = runtime.rulesDir.split('/')[0];
      const skillsDest = path.join(homeDir, skillsDir, 'skills');
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
