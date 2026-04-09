---
name: gum-create
description: Create a new GUM module with rules and optional hooks
---

# Create GUM Module

**This skill creates a new GUM module from scratch.** You guide the user through naming, describing, and defining behaviors -- then you generate all files, register the module, and sync hooks. When you finish, the module is live and enforced immediately.

**Announce at start:** "I'm using the gum-create skill to build a new GUM module."

## Checklist

IMMEDIATELY on skill load — before asking ANY question or producing ANY output other than the announcement — create a TaskCreate for EACH of these items:

1. **Ask module name** — one question, wait for answer
2. **Ask description** — one-line summary of what the module does
3. **Gather behaviors** — ask user to describe all rules/behaviors they want
4. **Classify each behavior** — mechanical (→ hook) or judgment-based (→ rule)
5. **Confirm classification** — present the split to user, get approval
6. **Generate module files** — module.yaml, rules.md, hooks.json
7. **Sync** — run `npx get-gum sync` via Bash to register module and sync rules/hooks
8. **Confirm active** — show the user their module is live

Mark each task as completed as you finish it. Do NOT batch — mark done immediately.

## The Iron Law

```
HOOKS OVER RULES FOR MECHANICAL TASKS. ALWAYS.
```

Rules depend on LLM compliance (~70%). Hooks are system-enforced (100%). If a behavior can be a hook, it MUST be a hook. Never leave guaranteed enforcement on the table.

## When to Use

- User says "create a module", "add a GUM module", "new gum rule"
- User wants to codify a recurring instruction into something portable
- User describes behaviors they want enforced across projects
- User wants to automate a pre/post action (lint, format, strip lines)

**Use this ESPECIALLY when:**

- User keeps repeating the same instruction every session
- User describes something mechanical ("always run X after Y")
- User wants team-wide behavior enforcement

**Don't skip when:**

- User says "just add it to CLAUDE.md" -- GUM modules are portable, CLAUDE.md is not
- User thinks it's "too small for a module" -- small, focused modules are ideal

## Process

### Phase 1: Gather Information (One Question at a Time)

**MUST ask one question at a time. NEVER batch questions.**

Bad (batching):

> "What's the module name, description, and what rules do you want?"

Good (sequential):

> "What should this module be called?"
> _(wait for answer)_
> "Got it. What should this module do? Describe the behaviors you want."

1. **Ask for module name** -- short, kebab-case (e.g., `enforce-tdd`, `no-console-log`)
2. **Ask for description** -- one sentence explaining the module's purpose
3. **Ask for desired behaviors** -- what rules, automations, or enforcement do they want?

### Phase 2: Evaluate Each Behavior

For EVERY behavior the user describes, classify it:

| Type           | Signal                                                        | Action              |
| -------------- | ------------------------------------------------------------- | ------------------- |
| **Mechanical** | Can be checked by regex, CLI tool, or script. Zero ambiguity. | Suggest as **hook** |
| **Judgment**   | Requires understanding context, intent, or tradeoffs.         | Keep as **rule**    |

**Mechanical examples (MUST suggest as hooks):**

- "Run lint after editing" --> `PostToolUse` hook on Write/Edit
- "Format code before committing" --> `PreCommit` hook
- "Remove Co-Authored-By lines" --> `PostToolUse` hook with sed/grep
- "Run tests after changes" --> `PostToolUse` hook

**Judgment examples (keep as rules):**

- "Prefer composition over inheritance"
- "Use the brainstorming skill before implementing features"
- "Keep functions under 30 lines when possible"
- "Write descriptive variable names"

**When suggesting a hook over a rule:**

> "This sounds mechanical -- 'always run lint after editing' can be a system hook that runs automatically with 100% compliance. As a rule, the agent follows it ~70% of the time. Want me to set it up as a hook instead?"

### Phase 3: Read Config and Generate Files

1. **Read `~/.gum/config.yaml`** to determine:
   - `storage` -- where modules live (e.g., `~/.gum/modules`)
   - `runtimes` -- which runtimes are installed (e.g., `claude`, `cursor`)

2. **Create module directory:** `<storage>/<module-name>/`

3. **Create `module.yaml`:**

   ```yaml
   name: <module-name>
   description: <one-line description>
   version: 1.0.0
   enabled: true
   ```

4. **Create `rules.md`** with the judgment-based rules:

   ```markdown
   # <Module Name> Rules

   - Prefer composition over inheritance when designing components
   - Always use the brainstorming skill before implementing new features
   ```

5. **Create `hooks.json`** (if any hooks were identified) with **per-runtime sections using the native settings.json format:**

   ```json
   {
     "claude": {
       "PostToolUse": [
         {
           "matcher": "Edit|Write",
           "hooks": [
             {
               "type": "command",
               "command": "jq -r '.tool_input.file_path' | xargs npx eslint --fix"
             }
           ]
         }
       ]
     }
   }
   ```

   **CRITICAL FORMAT:** Each runtime key contains an object where keys are event names (PreToolUse, PostToolUse, Stop, etc.) and values are arrays of hook entries. This matches the Claude Code settings.json hooks format exactly. Do NOT use a flat array — it MUST be `{ "EventName": [entries] }`.

   **MUST include a section for EVERY runtime listed in config.yaml.** Do not skip runtimes.

### Phase 4: Sync and Activate

1. **Run `npx get-gum sync` via Bash** -- this automatically registers the module in registry.json, syncs rules to runtime rules directories, and merges hooks into runtime settings. Do NOT manually edit registry.json or copy files.
2. **Confirm to user:** "Module `<name>` created and active. It has X rules and Y hooks."

## Key Rules

- **MUST** ask one question at a time -- never batch
- **MUST** read `~/.gum/config.yaml` before generating any files
- **MUST** suggest hooks over rules for any mechanical behavior
- **MUST** generate hooks.json with sections for ALL installed runtimes
- **MUST** run `npx get-gum sync` after creating module files -- never manually edit registry.json
- **NEVER** create a module without a description
- **NEVER** leave a mechanical rule as a rule when it could be a hook
- **NEVER** manually write to `~/.gum/registry.json` -- use `npx get-gum sync` instead

## Anti-Patterns

| Anti-Pattern                              | Why It's Wrong                        | Do This Instead                                 |
| ----------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| Asking all questions at once              | Overwhelms user, gets vague answers   | One question at a time, build understanding     |
| Putting "run lint" as a rule              | ~70% compliance vs 100% with hooks    | Suggest hook, explain the compliance difference |
| Skipping config.yaml read                 | Wrong storage path, missing runtimes  | Always read config first                        |
| Creating hooks.json with only one runtime | Other runtimes lose enforcement       | Include ALL installed runtimes                  |
| Not syncing hooks after creation          | Hooks exist in file but aren't active | Always sync after creating hooks.json           |
| Creating huge multi-purpose modules       | Hard to toggle, hard to share         | One concern per module                          |

## Examples

**Example 1: User wants lint enforcement**

```
User: "Create a module that runs eslint after I edit files"

Agent: "I'm using the gum-create skill to build a new GUM module."
Agent: "What should this module be called?"
User: "auto-lint"
Agent: "Got it. And a one-line description?"
User: "Automatically run eslint after file edits"
Agent: "This is a mechanical task — running eslint can be a system hook with 100%
        compliance. As a rule, the agent would only follow it ~70% of the time.
        I'll set it up as a PostToolUse hook on Write and Edit tools. Sound good?"
User: "Yes"
Agent: *reads config.yaml, creates module directory, generates module.yaml,
       creates empty rules.md, creates hooks.json with all runtimes,
       registers in registry.json, syncs hooks*
Agent: "Module `auto-lint` created and active. It has 0 rules and 1 hook
        (PostToolUse: eslint --fix on Write/Edit). Hooks synced to claude and cursor."
```

**Example 2: User wants mixed rules and hooks**

```
User: "I want a module for my team's coding standards"

Agent: "I'm using the gum-create skill to build a new GUM module."
Agent: "What should this module be called?"
User: "team-standards"
Agent: "What behaviors should this module enforce?"
User: "Run prettier on save, use TypeScript strict mode, prefer functional
       components in React, and always write tests before implementation"

Agent: "Let me break these down:
        - 'Run prettier on save' — mechanical, I'll make this a hook (100% enforcement)
        - 'Use TypeScript strict mode' — this is a tsconfig setting, not an agent rule.
          Want me to note it as a reminder rule, or skip it?
        - 'Prefer functional components' — judgment call, stays as a rule
        - 'Write tests before implementation' — judgment call, stays as a rule

        Does that split look right?"
```
