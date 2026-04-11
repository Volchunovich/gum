<div align="center">

# GUM — Globally Unified Modules

**Your AI agent rules and hooks, packaged once — applied everywhere.**

[![npm version](https://img.shields.io/npm/v/get-gum?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/get-gum)
[![Tests](https://img.shields.io/github/actions/workflow/status/Volchunovich/gum/test.yml?branch=main&style=for-the-badge&logo=github&label=Tests)](https://github.com/Volchunovich/gum/actions/workflows/test.yml)
[![GitHub stars](https://img.shields.io/github/stars/Volchunovich/gum?style=for-the-badge&logo=github&color=181717)](https://github.com/Volchunovich/gum)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

<br>

```bash
npx get-gum@latest
```

Works with **Claude Code · Gemini CLI · Copilot · Cursor · Windsurf · Codex** and [5 more](#supported-runtimes).

</div>

---

## The Problem

Every time you start a new project or open a new chat, your AI agent forgets how you like to work:

- Commit messages in the wrong format — again
- No linting after edits — again
- Agent jumps into code without discussing the approach — again

You end up copy-pasting the same rules into `CLAUDE.md`, `.cursorrules`, `GEMINI.md` across every repo. Update one — manually update the rest. Switch from Claude to Gemini — rewrite everything.

**GUM fixes this.** Define your rules once as modules. They auto-load in every project, every chat, every runtime.

---

## Quick Start

### 1. Install

```bash
npx get-gum@latest
```

The wizard asks which runtimes you use and where to store modules.

### 2. Create a module

In any AI chat session:

```
/gum-create
```

Tell the agent what behavior you want. It creates the module files for you.

Or create one manually — a module is just a folder with up to 3 files:

```
clean-commits/
  module.yaml    # metadata
  rules.md       # what the agent should do
  hooks.json     # automated enforcement (optional)
```

**module.yaml** — who is this module:

```yaml
name: clean-commits
description: "Conventional commits, English, max 72 chars"
version: 1.0.0
enabled: true
```

**rules.md** — instructions for the agent (natural language):

```markdown
## Commit rules

- Use conventional commits format: feat:, fix:, chore:, refactor:, docs:, test:
- Write commit messages in English
- Keep commit subject line under 72 characters
- Commit body maximum 3 lines
```

**hooks.json** — system-level automation that the agent can't skip (optional):

```json
{
  "claude": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$FILE\" 2>/dev/null; exit 0"
          }
        ]
      }
    ]
  }
}
```

### 3. Done

Open any project, start any chat — your modules are already active. No setup, no copy-pasting.

```bash
npx get-gum list          # see what's enabled
npx get-gum toggle        # turn modules on/off
npx get-gum doctor        # health check
```

---

## Rules vs Hooks

GUM modules can contain **rules**, **hooks**, or both.

|                | Rules                            | Hooks                                              |
| -------------- | -------------------------------- | -------------------------------------------------- |
| **What**       | Natural language instructions    | Shell commands                                     |
| **Compliance** | ~70% — agent can forget or skip  | 100% — runs automatically                          |
| **Good for**   | "Discuss approach before coding" | "Run prettier after every edit"                    |
| **Requires**   | Nothing — just write markdown    | Runtime support (see [table](#supported-runtimes)) |

**Rule-to-hook promotion:** During `/gum-create`, GUM detects mechanical rules and suggests converting them to hooks. _"Always run lint before commit"_ shouldn't be a rule the agent might forget — it should be a hook that runs every time.

---

## Per-Project Overrides

Not every module belongs in every project. You can override enabled/disabled state per project:

```json
// .gum.json — commit to git, whole team gets these overrides
{
  "overrides": {
    "clean-commits": true,
    "code-quality": false
  }
}
```

```json
// .gum.local.json — gitignored, just for you
{
  "overrides": {
    "my-experimental-module": true
  }
}
```

Priority: `.gum.local.json` > `.gum.json` > `module.yaml` default.

```bash
npx get-gum toggle --local       # edit team overrides
npx get-gum toggle --personal    # edit personal overrides
```

---

## In-Chat Skills

Use these inside your AI coding session:

| Skill           | What it does                                               |
| --------------- | ---------------------------------------------------------- |
| `/gum-create`   | Create a new module — AI helps write rules, suggests hooks |
| `/gum-edit`     | Edit an existing module                                    |
| `/gum-sync`     | Reload modules mid-session after changes                   |
| `/gum-optimize` | Analyze all rules, find duplicates, migrate from CLAUDE.md |
| `/gum-status`   | Show active modules in current session                     |
| `/gum-help`     | Quick reference                                            |

---

## CLI Reference

| Command                         | Description                                       |
| ------------------------------- | ------------------------------------------------- |
| `npx get-gum`                   | Interactive installer                             |
| `npx get-gum list`              | Show all modules with status                      |
| `npx get-gum toggle`            | Enable/disable modules interactively              |
| `npx get-gum toggle --local`    | Per-project team overrides                        |
| `npx get-gum toggle --personal` | Per-project personal overrides                    |
| `npx get-gum sync`              | Resync rules and hooks, auto-discover new modules |
| `npx get-gum doctor`            | Health check (context budget, integrity)          |
| `npx get-gum doctor --repair`   | Auto-fix issues                                   |
| `npx get-gum export <name>`     | Export module for sharing                         |
| `npx get-gum import <file>`     | Import module from file                           |
| `npx get-gum remove`            | Remove a module                                   |
| `npx get-gum update`            | Update GUM integration files                      |
| `npx get-gum uninstall`         | Remove GUM (keeps your modules)                   |

---

## Starter Modules

GUM ships with ready-to-use modules you can enable during install:

| Module | Type | What it does |
|---|---|---|
| **scope-guard** | rules | Minimal changes only — no unrequested refactoring, file creation, or cleanup |
| **safety-net** | hooks | Block dangerous commands — `rm -rf`, `DROP TABLE`, force push, `reset --hard` |
| **clean-commits** | rules | Conventional commits, English, max 72 chars |
| **auto-format** | hooks | Auto-run prettier on every file edit |
| **test-gate** | hooks + rules | Run tests before committing, write tests for new code |
| **enforce-tdd** | rules | Red-green-refactor — write failing tests first, then implement |
| **no-fluff** | rules | Concise responses — no emojis, no filler phrases, no unrequested docs |
| **security-basics** | hooks + rules | Block secrets in commits, enforce input validation and safe queries |
| **use-frontend-design** | rules + skill | Invoke `/frontend-design` skill before writing any UI code (off by default) |

---

## Supported Runtimes

| Runtime        | Rules | Hooks |
| -------------- | ----- | ----- |
| Claude Code    | yes   | yes   |
| Gemini CLI     | yes   | yes   |
| GitHub Copilot | yes   | —     |
| Cursor         | yes   | yes   |
| Windsurf       | yes   | —     |
| OpenCode       | yes   | yes   |
| Codex          | yes   | yes   |
| Kilo           | yes   | —     |
| Antigravity    | yes   | —     |
| Augment        | yes   | —     |
| Trae           | yes   | —     |

Rules work on all runtimes. Hooks use each runtime's native format — GUM handles the conversion.

---

## How It Works Under the Hood

```
~/your-modules/                     ~/.claude/rules/gum/
  clean-commits/                      clean-commits.md  ← synced
    module.yaml        gum sync →     code-quality.md   ← synced
    rules.md           ────────→      my-module.md      ← synced
    hooks.json
  code-quality/                     ~/.claude/settings.json
    module.yaml                       hooks: { ... }    ← synced
    rules.md
    hooks.json
```

Modules live in any folder you choose (Obsidian vault, Dropbox, git repo — your call). `gum sync` copies enabled rules into runtime-specific locations where they auto-load at session start. No permission prompts, no manual setup.

**Context budget:** Agents reliably follow ~150 lines of instructions. `gum doctor` tracks your total and warns before you exceed it. `/gum-optimize` helps reduce bloat.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and the issue-first contribution process.

## License

MIT
