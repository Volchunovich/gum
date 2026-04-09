---
name: gum-status
description: Show active GUM modules and their rules in the current session
---

# GUM Status

Show what modules are active and what rules the agent is following.

## Steps

1. Read ~/.gum/registry.json
2. For each module, read module.yaml to check enabled status
3. Check for .gum.json in current project directory for team overrides
4. Check for .gum.local.json for personal overrides
5. Apply override priority: .gum.local.json > .gum.json > module.yaml
6. For each active module, read and display its rules.md content
7. Format output clearly showing module name and its rules
