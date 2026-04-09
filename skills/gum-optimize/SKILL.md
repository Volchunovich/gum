---
name: gum-optimize
description: Analyze agent context and optimize GUM modules for better compliance
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Optimize GUM Modules

**This skill performs a deep analysis of your ENTIRE agent context -- every GUM module, every CLAUDE.md, every rule file -- and finds problems: bloat, vagueness, conflicts, and missed automation opportunities.** This is the LLM-powered audit. It reads everything, diagnoses everything, and offers to fix everything on the spot.

**Announce at start:** "I'm using the gum-optimize skill to audit your full agent context."

## The Iron Law

```
READ EVERYTHING BEFORE DIAGNOSING ANYTHING.
```

You MUST read ALL sources before presenting a single finding. Partial reads produce partial (wrong) diagnoses. No shortcuts.

## When to Use

- User says "optimize", "audit my rules", "clean up my modules"
- User notices the agent ignoring rules (symptom of context bloat or vagueness)
- User has accumulated many modules and wants a health check
- User migrated from scattered CLAUDE.md rules and wants consolidation
- After installing several new modules

**Use this ESPECIALLY when:**
- Agent compliance feels low -- rules are being ignored or partially followed
- User has been using GUM for a while and never audited
- Multiple team members have added modules independently
- User says "my context feels bloated" or "the agent seems confused"

**Don't skip when:**
- User thinks "everything is fine" -- silent conflicts are the worst kind
- User has only a few modules -- even 3 modules can conflict

## Process

### Phase 1: Read ALL Sources (No Exceptions)

**You MUST read every single one of these. Skipping any source means missed findings.**

| Source | Path | What You're Looking For |
|--------|------|------------------------|
| Registry | `~/.gum/registry.json` | All modules, enabled/disabled status |
| Module rules | `<storage>/<module>/rules.md` for each enabled module | Rule content, line counts, vagueness |
| Module hooks | `<storage>/<module>/hooks.json` for each enabled module | Hook coverage, mechanical enforcement |
| Project CLAUDE.md | `./CLAUDE.md` | Rules that should be GUM modules |
| User CLAUDE.md | `~/.claude/CLAUDE.md` | Global rules that should be GUM modules |
| Project rules | `.claude/rules/*.md` | Additional rule files |

**Read ALL of them. Then proceed.**

### Phase 2: Run All Checks

#### Check 1: Context Budget

Count total lines across ALL rules sources (rules.md files + CLAUDE.md files + .claude/rules/*.md).

| Lines | Status | Action |
|-------|--------|--------|
| < 100 | Healthy | No action needed |
| 100-150 | Warning | Suggest trimming vague or redundant rules |
| > 150 | Over budget | MUST reduce. Agent compliance drops sharply above 150 lines |

> "Your total context is 187 lines across 6 sources. This is over budget -- agent compliance drops significantly above 150 lines. Here are the largest contributors..."

#### Check 2: Vague Rule Detection

Flag rules that are too vague to be actionable. The agent cannot reliably follow what it cannot concretely interpret.

**Red flags:**
- "Write clean code"
- "Follow best practices"
- "Be careful with..."
- "Try to..."
- "When possible..."
- "Use good naming"

**For each vague rule, suggest a specific replacement:**

| Vague Rule | Specific Replacement |
|---|---|
| "Write clean code" | "Functions MUST be under 30 lines. Extract helper functions when exceeding this limit." |
| "Follow best practices" | DELETE -- means nothing. Replace with the specific practices you want. |
| "Be careful with error handling" | "All async functions MUST have try/catch. Use custom error classes, never throw raw strings." |
| "Use good naming" | "Variables describe their content (e.g., `userCount` not `n`). Functions describe their action (e.g., `fetchUserProfile` not `getData`)." |

#### Check 3: Cross-Module Conflicts

Detect contradictions between enabled modules. These cause unpredictable agent behavior -- the agent picks one arbitrarily or tries to satisfy both and fails at both.

**Common conflict patterns:**
- Module A: "use jest for testing" vs Module B: "use vitest for testing"
- Module A: "use tabs for indentation" vs Module B: "use 2 spaces"
- Module A: "always add JSDoc comments" vs Module B: "minimize comments, code should be self-documenting"
- Module A: "use CSS modules" vs Module B: "use Tailwind for all styling"

**For each conflict:**
> "CONFLICT: `testing-standards` says 'use jest' but `modern-tooling` says 'use vitest'. These cannot both be followed. Options:
> 1. Disable one module
> 2. Merge into a single module with a clear decision
> 3. Scope them to different projects via .gum.json overrides"

#### Check 4: Rule-to-Hook Promotion

Scan all rules.md files for mechanical rules that should be hooks.

**Indicators a rule should be a hook:**
- Contains "always run", "always execute", "must run"
- Describes a CLI command or script
- Has zero ambiguity -- a script could enforce it
- References specific tools (lint, format, test, build)

**For each candidate:**
> "PROMOTION CANDIDATE: `team-standards` has rule 'Always run prettier after editing files'. This is mechanical -- converting to a PostToolUse hook gives 100% enforcement (currently ~70% as a rule). Want me to promote it?"

#### Check 5: CLAUDE.md Migration

Scan CLAUDE.md files for rules that are better as GUM modules.

**Why migrate:**
- CLAUDE.md rules are project-locked -- GUM modules are portable
- CLAUDE.md has no hook support -- GUM modules can enforce mechanically
- CLAUDE.md cannot be toggled per-project -- GUM modules can

**Migration candidates:**
- Rules that apply across projects (coding style, testing approach)
- Rules that are mechanical (should be hooks)
- Groups of related rules that form a logical module

> "Your project CLAUDE.md has 12 lines about testing standards. These are portable -- they'd work in any project. Want me to create a `testing-standards` GUM module from them and remove them from CLAUDE.md?"

### Phase 3: Present Findings

Group findings by severity:

```
=== CRITICAL (breaks compliance) ===
1. Context over budget: 187/150 lines
2. CONFLICT: jest vs vitest in two modules

=== RECOMMENDED (improves compliance) ===
3. 3 mechanical rules should be hooks
4. 8 lines in CLAUDE.md are portable → GUM module candidates

=== ADVISORY (nice to have) ===
5. 2 vague rules could be more specific
6. 1 disabled module can be removed from registry
```

**For EVERY finding, offer to execute the fix immediately:**
> "Want me to fix any of these? I can handle them one at a time, or all at once."

## Key Rules

- **MUST** read ALL sources before presenting any findings -- no partial audits
- **MUST** count actual lines, not estimate -- precision matters for budget checks
- **MUST** present conflicts with specific module names and the contradicting rules
- **MUST** offer to execute each suggestion immediately
- **MUST** group findings by severity (critical > recommended > advisory)
- **NEVER** diagnose from a partial read -- read everything first
- **NEVER** present findings without actionable next steps
- **NEVER** silently skip a source because it doesn't exist -- note its absence

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Do This Instead |
|---|---|---|
| Reading only GUM modules, skipping CLAUDE.md | Misses half the context and all migration opportunities | Read ALL sources listed in Phase 1 |
| Estimating line counts | "About 120 lines" might actually be 160 (over budget) | Count precisely |
| Listing problems without fixes | User knows something is wrong but not how to fix it | Every finding MUST have an actionable suggestion |
| Fixing without asking | User may disagree with the suggestion | Present findings, offer to execute, wait for approval |
| Checking one module at a time | Misses cross-module conflicts entirely | Read all modules, then analyze holistically |
| Ignoring disabled modules | They still consume registry space; may conflict if re-enabled | Note disabled modules, suggest cleanup |

## Examples

**Example: Full audit flow**

```
User: "Optimize my GUM setup"

Agent: "I'm using the gum-optimize skill to audit your full agent context."
Agent: *reads registry (5 modules), reads all rules.md files, reads hooks.json
       files, reads ./CLAUDE.md, reads ~/.claude/CLAUDE.md, reads .claude/rules/*
       — total: 8 sources read*

Agent: "Audit complete. Here are my findings:

        === CRITICAL ===
        1. Context over budget: 163/150 lines across 5 modules + CLAUDE.md
        2. CONFLICT: `code-style` says 'use tabs' but `team-v2` says 'use 2-space indent'

        === RECOMMENDED ===
        3. PROMOTION: `code-style` has 'run prettier after edits' — should be a hook
        4. MIGRATION: ./CLAUDE.md has 15 lines about testing that match your
           `enforce-tdd` module — redundant duplication
        5. PROMOTION: `deploy-checks` has 'always run build before push' — should be a hook

        === ADVISORY ===
        6. VAGUE: `code-style` has 'write clean code' — not actionable
        7. DISABLED: `old-linting` is disabled and can be removed from registry

        Fixing #1-5 would bring you to ~115 lines (well within budget) and add
        2 hooks for 100% enforcement. Want me to start fixing these?"
```
