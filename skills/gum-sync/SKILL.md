---
name: gum-sync
description: Sync GUM modules in the current session after toggle, create, edit, or remove
---

# GUM Sync

**Resync GUM modules in the current chat session.** Run this after toggling, creating, editing, or removing modules to apply changes immediately without starting a new chat.

**Announce at start:** "Syncing GUM modules..."

## When to Use

- After running `npx get-gum toggle` to enable/disable modules
- After `/gum-create` or `/gum-edit` (they call sync automatically, but use this if something feels off)
- After manually editing module files in storage
- When modules feel out of date or not loading

## Process

1. **Run `npx get-gum sync` via Bash** — this registers new modules, syncs rules to `~/.claude/rules/gum/`, and merges hooks into runtime settings
2. **Read all files in `~/.claude/rules/gum/`** — this loads the updated rules into the current session
3. **Confirm:** "Synced. X modules active."

## Key Rules

- **MUST** run `npx get-gum sync` via Bash first, then read the synced files
- **MUST** report how many modules are now active
- **NEVER** skip reading the synced files — without this step, changes won't take effect until next session
