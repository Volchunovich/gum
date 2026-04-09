---
name: gum-edit
description: Edit an existing GUM module — update rules, hooks, or settings
---

# Edit GUM Module

Edit an existing module's rules, hooks, or manifest.

## Steps

1. Read ~/.gum/registry.json to get list of modules
2. If user didn't specify which module, ask them to choose
3. Read the module's current rules.md, module.yaml, and hooks.json (if exists)
4. Present current content to the user
5. Ask what they want to change
6. Update the files based on their request
7. If hooks.json was modified, resync hooks to runtime settings
8. Confirm changes
