---
name: gum-status
description: Show active GUM modules and their rules in the current session
---

# GUM Status

**This skill shows exactly what modules are active RIGHT NOW and what rules the agent is following.** Not module names -- the actual expanded rules content, override state, and hook configuration. The user should see the full picture of what governs agent behavior in this session.

**Announce at start:** "I'm using the gum-status skill to show your active GUM context."

## The Iron Law

```
SHOW THE RULES, NOT JUST THE NAMES.
```

"You have 4 active modules" is useless. The user needs to see what those modules SAY. Always expand and display the actual rules content.

## When to Use

- User says "status", "what modules are active", "show my rules", "what's gum doing"
- User wants to verify a module is enabled before relying on it
- User is confused about why the agent is or isn't following a rule
- User wants to check override state (team vs personal vs default)
- Before debugging compliance issues

**Use this ESPECIALLY when:**
- User says "why isn't the agent doing X" -- status reveals if the rule exists and is active
- User switched projects and wants to see what's active here
- User just ran `npx get-gum toggle` and wants to verify

## Process

### Phase 1: Read All State Sources

Read these in order:

1. **Run `npx get-gum list --gum-dir ~/.gum` via Bash** -- get all modules and their enabled/disabled status
2. **Read `~/.claude/rules/gum/*.md`** -- these are the synced active rules (auto-loaded, no permission needed)
3. **Read `.gum.json` in current directory** -- team-level overrides (if exists)
4. **Read `.gum.local.json` in current directory** -- personal overrides (if exists)

### Phase 2: Apply Override Priority

Overrides stack. Later sources win:

```
module.yaml (default) < .gum.json (team) < .gum.local.json (personal)
```

**MUST apply this correctly.** A module enabled in module.yaml but disabled in .gum.json is DISABLED. A module disabled in .gum.json but re-enabled in .gum.local.json is ENABLED.

Track the effective state AND the source of that state:

| Module | Default | Team Override | Personal Override | **Effective** |
|--------|---------|---------------|-------------------|---------------|
| enforce-tdd | enabled | -- | -- | **enabled** (default) |
| auto-lint | enabled | disabled | -- | **disabled** (team) |
| code-style | disabled | disabled | enabled | **enabled** (personal) |

### Phase 3: Expand and Display Active Modules

For each module that is effectively ENABLED:

1. **Read `rules.md`** -- display the full rules content
2. **Read `hooks.json`** (if exists) -- display hook configuration
3. **Show the override source** -- so the user knows WHY it's active

### Phase 4: Format Output

Present a clear, structured report:

```
=== GUM Status ===

Active Modules: 3 of 5

--- enforce-tdd (enabled by default) ---
Rules:
  - Write failing tests before implementation code
  - Each test should cover one specific behavior

Hooks:
  - PostToolUse on [Write, Edit]: npm test

--- code-style (enabled by personal override) ---
Rules:
  - Use 2-space indentation in all TypeScript files
  - Prefer named exports over default exports

Hooks: none

--- team-standards (enabled by default) ---
Rules:
  - Prefer functional components in React
  - Always use custom error classes

Hooks:
  - PostToolUse on [Write, Edit]: prettier --write $GUM_FILE

--- Inactive ---
  - auto-lint (disabled by team override in .gum.json)
  - old-linting (disabled by default)
```

## Key Rules

- **MUST** read registry first, then module.yaml for each module, then overrides
- **MUST** apply override priority correctly: module.yaml < .gum.json < .gum.local.json
- **MUST** show expanded rules content -- not just module names
- **MUST** show hooks information for each active module
- **MUST** show WHY each module is active or inactive (default, team override, personal override)
- **MUST** show inactive modules too, with reason for inactivity
- **NEVER** show just module names without their rules content
- **NEVER** skip override files even if you expect them not to exist -- check anyway
- **NEVER** guess at module state -- read the actual files

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Do This Instead |
|---|---|---|
| "You have 4 active modules: enforce-tdd, auto-lint, ..." | User doesn't know what those modules DO | Expand rules.md content for every active module |
| Skipping .gum.json / .gum.local.json check | Module may be overridden and you'd show wrong state | Always check both override files |
| Showing only active modules | User can't see what's disabled or why | Show inactive modules with disable reason |
| Not showing override source | User can't debug "why is this on/off?" | Always show which layer controls the state |
| Reading only registry, not module files | Registry has names but not rules content | Read module.yaml + rules.md + hooks.json for each |
| Ignoring hooks in output | Hooks are half the enforcement story | Always show hooks alongside rules |

## Examples

**Example 1: Standard status check**

```
User: "What GUM modules are active?"

Agent: "I'm using the gum-status skill to show your active GUM context."
Agent: *reads registry (4 modules), reads module.yaml for each, checks .gum.json
       (not found), checks .gum.local.json (not found)*

Agent: "=== GUM Status ===

        Active Modules: 3 of 4

        --- enforce-tdd (enabled by default) ---
        Rules:
          - Write failing tests before implementation code
          - Run tests after every code change
        Hooks: none

        --- auto-lint (enabled by default) ---
        Rules: none
        Hooks:
          - PostToolUse on [Write, Edit]: eslint --fix $GUM_FILE

        --- team-standards (enabled by default) ---
        Rules:
          - Prefer functional components in React
        Hooks:
          - PostToolUse on [Write, Edit]: prettier --write $GUM_FILE

        --- Inactive ---
          - old-linting (disabled by default)"
```

**Example 2: Override debugging**

```
User: "Why isn't auto-lint running in this project?"

Agent: *reads registry, reads module files, finds .gum.json in project*

Agent: "Found it. `auto-lint` is enabled by default in module.yaml, but your
        project's .gum.json has it disabled:

        .gum.json: { \"auto-lint\": { \"enabled\": false } }

        This is a team-level override — someone on the team disabled it for
        this project. Options:
        1. Re-enable it in .gum.json (affects the whole team)
        2. Override personally in .gum.local.json (just for you)
        3. Leave it disabled"
```
