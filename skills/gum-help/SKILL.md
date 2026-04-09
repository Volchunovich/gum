---
name: gum-help
description: GUM reference and usage guide
---

# GUM Help

GUM (Globally Unified Modules) — reusable AI agent behavior bundles.

## CLI Commands

| Command | Description |
|---------|-------------|
| npx get-gum@latest | Install GUM |
| npx get-gum toggle | Enable/disable modules (interactive) |
| npx get-gum toggle --local | Per-project team overrides |
| npx get-gum toggle --personal | Per-project personal overrides |
| npx get-gum list | Show all modules |
| npx get-gum remove | Remove a module |
| npx get-gum doctor | Health check |
| npx get-gum doctor --repair | Auto-fix issues |
| npx get-gum export <name> | Export module to .gum.json |
| npx get-gum import <file> | Import module from file or URL |
| npx get-gum sync | Resync hooks |
| npx get-gum update | Update GUM |
| npx get-gum uninstall | Remove GUM |

## In-Chat Skills

| Skill | Description |
|-------|-------------|
| /gum-create | Create a new module |
| /gum-edit | Edit an existing module |
| /gum-optimize | Analyze and optimize rules |
| /gum-status | Show active modules |
| /gum-help | This help |

## Module Structure

A module is a folder containing:
- module.yaml — name, description, version, enabled flag
- rules.md — instructions for the agent
- hooks.json — system hooks per runtime (optional)

## Per-Project Overrides

- .gum.json — team overrides (commit to git)
- .gum.local.json — personal overrides (gitignored)
