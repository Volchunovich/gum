# Contributing to GUM

## Getting Started

```bash
git clone https://github.com/Volchunovich/gum.git
cd gum
npm install
npm test
```

---

## Types of Contributions

GUM accepts three types of contributions. Each has a different process. **Read this section before opening anything.**

### Bug Fix

A fix corrects something that is broken, crashes, or behaves contrary to documented behavior.

**Process:**
1. Open a [Bug Report issue](https://github.com/Volchunovich/gum/issues/new?template=bug_report.yml)
2. Wait for confirmation (label: `confirmed-bug`)
3. Write a regression test that demonstrates the bug
4. Fix it
5. Open a PR using the Fix template — link the confirmed issue

### Enhancement

An enhancement improves an existing feature — better output, faster execution, cleaner UX. It does **not** add new commands, new skills, or new concepts.

**Process:**
1. Open an [Enhancement issue](https://github.com/Volchunovich/gum/issues/new?template=feature_request.yml) with a written proposal
2. Wait for maintainer approval (label: `approved-enhancement`)
3. Write the code — keep scope exactly as approved
4. Open a PR — link the approved issue

### Feature

A feature adds something new — a new CLI command, a new skill, a new runtime. Features have the highest bar.

**Process:**
1. Check [Discussions](https://github.com/Volchunovich/gum/discussions) first
2. Open a Feature Request issue with a complete spec
3. Wait for maintainer approval (label: `approved-feature`)
4. Implement exactly the approved spec
5. Open a PR — link the approved issue

---

## The Issue-First Rule

> **No code before approval.**

- **Fixes**: open issue → confirm it's a bug → fix it
- **Enhancements**: open issue → get `approved-enhancement` → code
- **Features**: open issue → get `approved-feature` → code

PRs without a linked, properly-labeled issue are closed without review. This protects you from spending time on work that will be rejected.

---

## Pull Request Guidelines

- **Link to an approved issue** — use `Closes #123` or `Fixes #123`
- **One concern per PR** — bug fixes, enhancements, and features must be separate PRs
- **No draft PRs** — only open when complete and tested
- **No drive-by formatting** — don't reformat code unrelated to your change
- **CI must pass** — all test matrix jobs must be green
- **Scope matches the approved issue** — extra changes will be asked to be removed

---

## Project Structure

```
bin/
  install.js              — Interactive installer (npx get-gum)
  cli.js                  — CLI commands (list, toggle, doctor, etc.)
lib/
  config.js               — GUM config read/write
  registry.js             — Module path registry
  modules.js              — Module CRUD and override resolution
  runtimes.js             — AI runtime definitions
  hooks.js                — Hook sync with manifest tracking
  doctor.js               — Health checks and auto-repair
  export.js               — Module import/export
  utils.js                — Shared helpers
skills/                   — SKILL.md files for in-chat commands
starters/                 — Pre-built starter modules
templates/                — Templates for new modules
tests/                    — Test files (vitest)
```

---

## Code Style

- **ESM modules** — `import`/`export`, `"type": "module"` in package.json
- **JSDoc on all exported functions** — `@param`, `@returns`
- **Module-level JSDoc header** on every `.js` file:
  ```js
  /**
   * ModuleName — Short description
   */
  ```
- **Conventional commits** — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `ci:`
- **No unnecessary dependencies** — use Node.js built-ins where possible
- **Pinned dependency versions** — no `^` prefix

---

## Testing Standards

All tests use **vitest** with `globals: true`.

### Running Tests

```bash
npm test            # run once
npm run test:watch  # watch mode
```

### Test Structure

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('featureName', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gum-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('handles normal case', () => {
    // Arrange → Act → Assert
  });

  it('handles edge case', () => {
    // ...
  });
});
```

### Test Requirements by Contribution Type

- **Bug fix** — regression test required. Must fail before fix, pass after.
- **Enhancement** — tests covering enhanced behavior. Update existing tests if behavior changed.
- **Feature** — tests for success path + at least one failure scenario.

### CLI Tests

Test CLI commands via `execFileSync`:

```js
const CLI = path.resolve('bin/cli.js');
const out = execFileSync('node', [CLI, 'list', '--gum-dir', tmpDir], {
  encoding: 'utf-8',
});
expect(out).toContain('expected output');
```

---

## Security

- **Path validation** — all module names are validated via `validateModuleName()`. Never use unsanitized user input in `path.join()`.
- **Safe JSON parsing** — use `readJSON()` from `lib/utils.js` instead of raw `JSON.parse(fs.readFileSync(...))`.
- **No shell injection** — prefer `execFileSync` (array args) over `execSync` (string interpolation).

---

## Questions?

Open a [Discussion](https://github.com/Volchunovich/gum/discussions) or check existing issues.
