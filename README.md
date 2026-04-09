<div align="center">

# GUM — Globally Unified Modules

**Reusable AI agent behavior bundles. Define rules and hooks once, use everywhere — across projects, chats, and runtimes.**

**Solves the "repeat yourself" problem — stop configuring the same behaviors in every new project and chat session.**

[![npm version](https://img.shields.io/npm/v/get-gum?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/get-gum)
[![Tests](https://img.shields.io/github/actions/workflow/status/Volchunovich/gum/test.yml?branch=main&style=for-the-badge&logo=github&label=Tests)](https://github.com/Volchunovich/gum/actions/workflows/test.yml)
[![GitHub stars](https://img.shields.io/github/stars/Volchunovich/gum?style=for-the-badge&logo=github&color=181717)](https://github.com/Volchunovich/gum)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

<br>

```bash
npx get-gum
```

**Works with Claude Code, Gemini CLI, Copilot, Cursor, Windsurf, OpenCode, Codex, and more.**

<br>

*"I was copy-pasting the same CLAUDE.md rules into every project. Now I define them once and they just work everywhere."*

<br>

[Why GUM?](#why-gum) · [How It Works](#how-it-works) · [Commands](#commands) · [In-Chat Skills](#in-chat-skills) · [Contributing](CONTRIBUTING.md)

</div>

---

## Why GUM?

Every AI coding agent user has the same problem:

> *"Don't add Co-Authored-By to commits"*
> *"Always run lint before committing"*
> *"Use brainstorming before implementation"*

You write these rules in CLAUDE.md. Then you start a new project — and write them again. Switch to Gemini — write them again. New chat session — hope the agent remembers.

**GUM fixes this.** Create a module once, it works in every project, every chat, every runtime. No copy-pasting. No reminders. No forgetting.

The key insight: **modules live outside your projects.** Store them in Obsidian, a shared folder, anywhere. Your agent reads them at the start of every session automatically.

---

## How It Works

A **module** is a folder with three files:

```
my-module/
  module.yaml    # name, description, version, enabled
  rules.md       # natural language instructions for the agent
  hooks.json     # system-level hooks per runtime (optional)
```

**Rules** are instructions the agent follows. They work ~70% of the time because agents can forget or judge them irrelevant.

**Hooks** are system-level commands that execute automatically. They work 100% of the time — the agent can't ignore them.

GUM helps you decide which is which. When you create a module, it suggests: *"This rule is mechanical — want to make it a hook instead?"*

### The Flow

```
1. npx get-gum                    → Install, pick runtimes, set storage path
2. /gum-create                    → Create a module in chat with AI help
3. Open any project, any chat     → Agent reads your modules automatically
4. npx get-gum toggle             → Enable/disable modules interactively
5. npx get-gum doctor             → Health check your setup
```

### Per-Project Control

Not every module makes sense in every project. Override globally-enabled modules per project:

- **`.gum.json`** — team overrides (commit to git)
- **`.gum.local.json`** — personal overrides (gitignored)

Priority: `.gum.local.json` > `.gum.json` > `module.yaml` (global default)

```bash
npx get-gum toggle --local      # set team overrides
npx get-gum toggle --personal   # set personal overrides
```

---

## Install

```bash
npx get-gum
```

Interactive wizard asks:
1. Which runtimes (Claude Code, Gemini, Copilot, Cursor, etc.)
2. Where to store modules (Obsidian vault recommended)
3. Optional starter modules to get started immediately

**Non-interactive** for teams/CI:

```bash
npx get-gum --claude --gemini --storage ~/shared/gum-modules
npx get-gum --all --storage ~/Obsidian/vault/gum-modules
```

### Starter Modules

GUM ships with pre-built modules you can enable during install:

| Module | What it does |
|--------|-------------|
| **clean-commits** | Conventional commits, English, max 72 chars |
| **code-quality** | Auto-format after edits, lint before commit |
| **thoughtful-dev** | Discuss before implementing, review for edge cases |

---

## Commands

### CLI

| Command | Description |
|---------|-------------|
| `npx get-gum` | Interactive installer |
| `npx get-gum toggle` | Enable/disable modules (space = toggle, enter = save) |
| `npx get-gum toggle --local` | Per-project team overrides |
| `npx get-gum toggle --personal` | Per-project personal overrides |
| `npx get-gum list` | Show all modules with status |
| `npx get-gum remove` | Remove a module |
| `npx get-gum doctor` | Health check — context budget, integrity, skill refs |
| `npx get-gum doctor --repair` | Auto-fix orphaned entries, resync hooks |
| `npx get-gum export <name>` | Export module to `.gum.json` for sharing |
| `npx get-gum import <file>` | Import module from file or URL |
| `npx get-gum sync` | Resync hooks to runtime settings |
| `npx get-gum update` | Update GUM skills in all runtimes |
| `npx get-gum uninstall` | Remove GUM (keeps your modules) |
| `npx get-gum --help` | Show all flags and examples |

### In-Chat Skills

Use these inside your AI coding agent chat:

| Skill | Description |
|-------|-------------|
| `/gum-create` | Create a module — AI helps write rules, suggests hooks for mechanical tasks |
| `/gum-edit` | Edit an existing module's rules and hooks |
| `/gum-optimize` | Analyze full context (CLAUDE.md + modules), find duplicates, migrate rules, detect conflicts |
| `/gum-status` | Show active modules and their rules in current session |
| `/gum-help` | Quick reference |

---

## Supported Runtimes

| Runtime | Rules | Hooks |
|---------|-------|-------|
| Claude Code | ✅ | ✅ |
| Gemini CLI | ✅ | ✅ |
| GitHub Copilot | ✅ | — |
| Cursor | ✅ | ✅ |
| Windsurf | ✅ | — |
| OpenCode | ✅ | ✅ |
| Codex | ✅ | ✅ |
| Kilo | ✅ | — |
| Antigravity | ✅ | — |
| Augment | ✅ | — |
| Trae | ✅ | — |

Rules work on all runtimes. Hooks use each runtime's native format — GUM handles the conversion.

---

## Smart Rule Quality

GUM doesn't just store rules — it helps you write rules that agents actually follow.

### Rule-to-Hook Promotion

During `/gum-create` and `/gum-optimize`, GUM detects mechanical rules and suggests converting them to hooks:

> *"Always run lint before commit"* → can be a hook (100% guaranteed)
> *"Use brainstorming before implementation"* → stays as a rule (needs judgment)

### Context Budget

Agents reliably follow ~150 lines of instructions. More than that and compliance drops. `gum doctor` tracks your total and warns before you hit the limit. `/gum-optimize` helps reduce it.

### CLAUDE.md Migration

Already have rules scattered across CLAUDE.md files? `/gum-optimize` can migrate them into portable GUM modules.

---

## Storage

Modules live in any folder. **Obsidian vault recommended** — modules are markdown, so you get rich editing, graph view, and cross-device sync for free.

GUM has no Obsidian dependency. It just reads files from a path.

---

## Architecture

```
~/.gum/
  config.yaml          # runtimes, storage path
  registry.json        # module name → path mapping
  hooks-manifest.json  # tracks which hooks GUM manages

~/.claude/rules/gum.md  # tells Claude to read GUM modules
~/.gemini/rules/gum.md  # tells Gemini to read GUM modules

~/Obsidian/vault/gum-modules/   # your modules (or any folder)
  my-module/
    module.yaml
    rules.md
    hooks.json
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and the issue-first contribution process.

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**AI agents are powerful. GUM makes them consistent.**

</div>
