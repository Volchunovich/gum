---
name: gum-help
description: GUM reference and usage guide
---

# GUM Help

**GUM (Globally Unified Modules) -- reusable AI agent behavior bundles that travel with you across projects and runtimes.** This is the complete reference for GUM commands, skills, concepts, and workflows.

## Quick Start

New to GUM? Here's the 60-second version:

1. **Install:** `npx get-gum@latest`
2. **Create your first module:** `/gum-create` in chat -- the agent walks you through it
3. **Check what's active:** `/gum-status` to see your modules and their rules
4. **That's it.** Your module is live and enforced immediately.

## Core Concepts

**Module** -- a folder containing rules (for the LLM) and hooks (for the system). One concern per module.

**Rules** (`rules.md`) -- judgment-based instructions the agent follows. Compliance is ~70% because the LLM interprets them. Example: "Prefer composition over inheritance."

**Hooks** (`hooks.json`) -- mechanical actions the system executes automatically. Compliance is 100% because code enforces them. Example: "Run eslint after every file edit."

**The golden rule:** If a behavior is mechanical, make it a hook. If it requires judgment, make it a rule. Never leave guaranteed enforcement on the table.

## CLI Commands

| Command                         | Description                                      |
| ------------------------------- | ------------------------------------------------ |
| `npx get-gum@latest`            | Install GUM                                      |
| `npx get-gum toggle`            | Enable/disable modules (interactive)             |
| `npx get-gum toggle --local`    | Per-project team overrides (.gum.json)           |
| `npx get-gum toggle --personal` | Per-project personal overrides (.gum.local.json) |
| `npx get-gum list`              | Show all modules and their status                |
| `npx get-gum remove`            | Remove a module entirely                         |
| `npx get-gum doctor`            | Health check -- find broken modules, stale hooks |
| `npx get-gum doctor --repair`   | Auto-fix issues found by doctor                  |
| `npx get-gum export <name>`     | Export module to shareable .gum.json             |
| `npx get-gum import <file>`     | Import module from file or URL                   |
| `npx get-gum sync`              | Resync all hooks to runtime settings             |
| `npx get-gum update`            | Update GUM to latest version                     |
| `npx get-gum uninstall`         | Remove GUM completely                            |

## In-Chat Skills

| Skill           | What It Does                            | When to Use                                           |
| --------------- | --------------------------------------- | ----------------------------------------------------- |
| `/gum-create`   | Create a new module from scratch        | "I want to enforce X"                                 |
| `/gum-edit`     | Modify an existing module               | "Change the rules in my X module"                     |
| `/gum-sync`     | Reload modules in current session       | After toggle/create/edit/remove                       |
| `/gum-optimize` | Deep audit of all rules and modules     | "My rules feel bloated" or "agent is ignoring things" |
| `/gum-status`   | Show active modules with expanded rules | "What's active right now?"                            |
| `/gum-help`     | This reference                          | "How does GUM work?"                                  |

## Module Structure

```
~/.gum/modules/my-module/
  module.yaml    # name, description, version, enabled flag
  rules.md       # judgment-based instructions for the agent
  hooks.json     # system hooks per runtime (optional)
```

**module.yaml:**

```yaml
name: my-module
description: What this module does
version: 1.0.0
enabled: true
```

**rules.md:**

```markdown
- Prefer functional components in React
- Always use custom error classes instead of throwing generic Error
```

**hooks.json:**

```json
{
  "claude": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

## Per-Project Overrides

Override priority (later wins):

```
module.yaml (default) < .gum.json (team) < .gum.local.json (personal)
```

| File              | Scope    | Git?         | Use Case                                       |
| ----------------- | -------- | ------------ | ---------------------------------------------- |
| `.gum.json`       | Team     | Commit it    | "Nobody on this project uses module X"         |
| `.gum.local.json` | Personal | Gitignore it | "I want module Y even though team disabled it" |

## Common Workflows

### "I keep telling the agent the same thing"

1. `/gum-create` -- turn the repeated instruction into a module
2. If it's mechanical (run lint, format, test), it becomes a hook
3. If it's judgment-based (prefer X over Y), it becomes a rule
4. Never repeat yourself again

### "The agent is ignoring my rules"

1. `/gum-status` -- verify the module is actually active
2. Check override files -- maybe .gum.json disabled it
3. `/gum-optimize` -- check for context bloat (>150 lines kills compliance)
4. Check for vague rules -- "write clean code" is unenforceable

### "I want to share modules with my team"

1. `npx get-gum export my-module` -- creates a shareable file
2. Teammate runs `npx get-gum import <file-or-url>`
3. Use `.gum.json` for team-wide overrides in each project

### "I'm migrating from CLAUDE.md rules"

1. `/gum-optimize` -- it scans CLAUDE.md and suggests modules
2. For each group of related rules, create a GUM module
3. Remove migrated rules from CLAUDE.md
4. Now your rules are portable and toggleable

### "Something feels broken"

1. `npx get-gum doctor` -- checks for broken modules, stale hooks, missing files
2. `npx get-gum doctor --repair` -- auto-fixes what it can
3. `npx get-gum sync` -- force resync all hooks
4. `/gum-optimize` -- deeper analysis if doctor doesn't find it

## Troubleshooting

| Problem                               | Likely Cause                               | Fix                                        |
| ------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| Module not appearing in status        | Module not synced — run `npx get-gum sync` | `npx get-gum doctor --repair`              |
| Hook not firing                       | hooks.json not synced to runtime           | `npx get-gum sync`                         |
| Agent ignoring rules                  | Context over budget (>150 lines)           | `/gum-optimize` to trim                    |
| Agent ignoring rules                  | Rule is too vague                          | Rewrite with specific, actionable language |
| Wrong module active                   | Override in .gum.json or .gum.local.json   | `/gum-status` shows override source        |
| Conflicting behavior                  | Two modules contradict each other          | `/gum-optimize` detects conflicts          |
| Module works locally but not for team | Not exported/shared                        | `npx get-gum export` + team imports        |
