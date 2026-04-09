---
name: gum-create
description: Create a new GUM module with rules and optional hooks
---

# Create GUM Module

Create a new module in the user's GUM storage.

## Steps

1. Ask the user for the module name
2. Ask them to describe the rules and behaviors they want
3. For each rule, evaluate: is this mechanical (can be enforced by a hook) or judgment-based (must stay as a rule)?
   - Mechanical examples: "run lint", "format code", "remove Co-Authored-By" → suggest as hook
   - Judgment examples: "use brainstorming", "prefer composition" → keep as rule
4. Generate module files:
   - Read ~/.gum/config.yaml to determine installed runtimes and storage path
   - Create <storage>/<module-name>/module.yaml with name, description, version, enabled: true
   - Create <storage>/<module-name>/rules.md with the judgment-based rules
   - If hooks were identified, create <storage>/<module-name>/hooks.json with per-runtime sections for each installed runtime
5. Register the module: add entry to ~/.gum/registry.json
6. If hooks were created, sync them by reading the hooks.json and merging into each runtime's settings file
7. Confirm: "Module created and active"
