# GUM — Globally Unified Modules

Reusable AI agent behavior bundles. Define rules and hooks once, use everywhere — across projects, chats, and runtimes.

## Install

```bash
npx get-gum
```

Non-interactive:

```bash
npx get-gum --claude --gemini --storage ~/Obsidian/vault/gum-modules
```

## Quick Start

1. Install GUM and select your runtimes
2. Create your first module: `/gum-create` in chat
3. Your rules now work in every project automatically

## What is a Module?

A module is a folder containing:

```
my-module/
  module.yaml    # name, description, version, enabled
  rules.md       # instructions for the agent
  hooks.json     # system hooks per runtime (optional)
```

**Rules** are natural language instructions the agent follows (~70% compliance).
**Hooks** are system-level commands that execute automatically (100% guaranteed).

Modules live in external storage (Obsidian vault recommended) and are shared across all projects.

## CLI Commands

```bash
npx get-gum              # Install
npx get-gum toggle       # Enable/disable modules (interactive)
npx get-gum toggle --local    # Per-project team overrides
npx get-gum toggle --personal # Per-project personal overrides
npx get-gum list         # Show all modules
npx get-gum remove       # Remove a module
npx get-gum doctor       # Health check (context budget, integrity)
npx get-gum doctor --repair   # Auto-fix issues
npx get-gum export <mod> # Export module to .gum.json
npx get-gum import <file># Import module from file or URL
npx get-gum sync         # Resync hooks to runtime settings
npx get-gum update       # Update GUM
npx get-gum uninstall    # Remove GUM (keeps your modules)
```

## In-Chat Skills

| Skill | Description |
|-------|-------------|
| `/gum-create` | Create a module with AI help |
| `/gum-edit` | Edit an existing module |
| `/gum-optimize` | Analyze and optimize rules |
| `/gum-status` | Show active modules and rules |
| `/gum-help` | Reference guide |

## Supported Runtimes

- Claude Code
- Gemini CLI
- GitHub Copilot
- Cursor
- Windsurf

## Per-Project Overrides

- `.gum.json` — team overrides (commit to git)
- `.gum.local.json` — personal overrides (gitignored)

Priority: `.gum.local.json` > `.gum.json` > `module.yaml` (global default)

## License

MIT
