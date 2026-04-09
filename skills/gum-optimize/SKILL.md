---
name: gum-optimize
description: Analyze agent context and optimize GUM modules for better compliance
---

# Optimize GUM Modules

Analyze the full agent context and optimize for better rule compliance.

## Analysis Steps

1. Read all enabled modules from ~/.gum/registry.json
2. Read each module's rules.md
3. Read the project's CLAUDE.md (if exists) and ~/.claude/CLAUDE.md (if exists)
4. Read .claude/rules/*.md files (if any)

## Checks to Perform

### Context Budget
- Count total lines across all rules sources
- If over 150 lines, flag as over budget

### Vague Rule Detection
- Flag rules that are too vague: "write clean code", "follow best practices", "be careful"
- Suggest specific, actionable replacements

### Cross-Module Conflicts
- Detect contradictions between enabled modules
- Example: Module A says "use jest" while Module B says "use vitest"
- Suggest resolution: disable one, or merge into a single module

### Rule-to-Hook Promotion
- Identify mechanical rules that could be hooks for guaranteed execution
- "Always run lint" → PostToolUse hook
- "Format after editing" → PostToolUse hook
- Suggest converting with the user's permission

### CLAUDE.md Migration
- Identify rules in CLAUDE.md that could be GUM modules
- Offer to create modules from those rules and remove from CLAUDE.md
- This makes rules portable across projects

## Output

Present findings with actionable suggestions. For each suggestion, offer to execute it immediately.
