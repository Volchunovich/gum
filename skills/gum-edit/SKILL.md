---
name: gum-edit
description: Edit an existing GUM module — update rules, hooks, or settings
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Edit GUM Module

**This skill modifies an existing GUM module.** You read the module's current state, present it clearly, discuss changes with the user, update files, and resync hooks if needed. The user should always see what exists before deciding what to change.

**Announce at start:** "I'm using the gum-edit skill to modify an existing GUM module."

## The Iron Law

```
SHOW BEFORE YOU CHANGE. ALWAYS.
```

Never ask "what do you want to change?" without first showing the user exactly what the module contains right now. Context before questions.

## When to Use

- User says "edit module", "update my gum module", "change the rules in X"
- User wants to add, remove, or modify rules in an existing module
- User wants to add or change hooks in a module
- User wants to enable/disable a module or change its metadata
- User realizes a rule should be a hook (or vice versa)

**Use this ESPECIALLY when:**
- User says "that rule isn't working" -- may need rule-to-hook promotion
- User wants to tweak hook behavior (different event, different tools)
- Module has grown stale and needs cleanup

## Process

### Phase 1: Find the Module

1. **Read `~/.gum/registry.json`** to get the list of all modules
2. If user specified a module name, locate it. If not found, show available modules and ask.
3. If user didn't specify, show the list and ask which one to edit:
   > "Which module do you want to edit? Here are your modules:
   > - `enforce-tdd` — Enforce test-driven development workflow
   > - `auto-lint` — Run eslint after file edits
   > - `team-standards` — Team coding standards"

### Phase 2: Read and Present Current State

**Read ALL module files:**
- `module.yaml` -- name, description, version, enabled status
- `rules.md` -- current rules content
- `hooks.json` -- current hooks (if exists)

**Present everything clearly:**

```
Module: enforce-tdd
Description: Enforce test-driven development workflow
Version: 1.0.0
Enabled: true

Rules (rules.md):
  - Write failing tests before implementation code
  - Each test should cover one specific behavior
  - Run tests after every code change

Hooks (hooks.json):
  - PostToolUse on [Write, Edit]: npm test
```

**MUST show this before asking what to change.** The user needs to see the full picture.

### Phase 3: Discuss Changes

Ask what they want to change. Listen for:

- **Adding rules** -- new judgment-based behaviors
- **Removing rules** -- rules that are no longer relevant
- **Modifying rules** -- rewording for clarity or specificity
- **Adding hooks** -- new mechanical enforcement
- **Modifying hooks** -- different events, tools, or commands
- **Rule-to-hook promotion** -- actively suggest this when you spot mechanical rules

**Actively suggest promotions:**
> "I notice you have 'always format code after editing' as a rule. This is mechanical -- want me to convert it to a PostToolUse hook for 100% enforcement?"

### Phase 4: Apply Changes

1. **Update the relevant files** -- rules.md, hooks.json, and/or module.yaml
2. **Bump the version** in module.yaml if the change is substantive
3. **If hooks.json was modified:**
   - Read `~/.gum/config.yaml` to get installed runtimes
   - Resync hooks to all runtime settings files
   - **MUST resync. Changed hooks that aren't synced are silently inactive.**
4. **Confirm changes** with a summary:
   > "Updated `enforce-tdd`: added 1 rule, promoted 1 rule to hook, removed 1 stale rule. Hooks resynced."

## Key Rules

- **MUST** read registry first to find the module path
- **MUST** show current module content before asking what to change
- **MUST** resync hooks if hooks.json was modified -- no exceptions
- **MUST** read config.yaml for runtimes before syncing hooks
- **MUST** suggest rule-to-hook promotion when spotting mechanical rules
- **NEVER** edit a module without showing its current state first
- **NEVER** modify hooks.json without resyncing afterward
- **NEVER** silently skip missing files -- if hooks.json doesn't exist, say so

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Do This Instead |
|---|---|---|
| Asking "what do you want to change?" immediately | User doesn't remember module contents | Show current state first, then ask |
| Editing hooks.json without resyncing | Hooks file updated but runtime doesn't know | Always resync after hooks.json changes |
| Ignoring mechanical rules during edit | Missed optimization opportunity | Actively suggest rule-to-hook promotion |
| Overwriting the entire rules.md | Destroys rules user didn't mention | Surgically add/remove/modify specific rules |
| Not checking if module exists in registry | Cryptic file-not-found errors | Read registry first, handle missing gracefully |
| Editing without reading config.yaml | Wrong paths, missing runtime sync | Read config before any file operations |

## Examples

**Example 1: Simple rule addition**

```
User: "Add a rule to my team-standards module about error handling"

Agent: "I'm using the gum-edit skill to modify an existing GUM module."
Agent: *reads registry, finds team-standards, reads all files*
Agent: "Here's the current state of `team-standards`:

        Rules:
          - Prefer functional components in React
          - Write tests before implementation

        Hooks:
          - PostToolUse on [Write, Edit]: prettier --write $GUM_FILE

        What error handling rule do you want to add?"

User: "Always use custom error classes instead of throwing generic Error"

Agent: *appends rule to rules.md*
Agent: "Added to `team-standards` rules.md:
        '- Always use custom error classes instead of throwing generic Error'
        No hooks changed, no resync needed."
```

**Example 2: Rule-to-hook promotion during edit**

```
User: "Edit my enforce-tdd module"

Agent: *reads registry, reads module files*
Agent: "Here's `enforce-tdd`:

        Rules:
          - Write failing tests before implementation
          - Run tests after every code change
          - Format test files with prettier

        No hooks currently.

        I notice two potential improvements:
        1. 'Run tests after every code change' — this is mechanical.
           As a hook, it runs automatically with 100% compliance.
        2. 'Format test files with prettier' — also mechanical.
           Perfect candidate for a PostToolUse hook.

        Want me to promote these to hooks?"

User: "Yes, both"

Agent: *creates hooks.json, updates rules.md to remove promoted rules,
       reads config.yaml for runtimes, syncs hooks*
Agent: "Done. `enforce-tdd` now has:
        - 1 rule: 'Write failing tests before implementation'
        - 2 hooks: PostToolUse for test runner and prettier
        Hooks synced to claude and cursor runtimes."
```
