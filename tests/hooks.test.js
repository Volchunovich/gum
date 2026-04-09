// tests/hooks.test.js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  syncHooksToRuntime,
  removeHooksFromRuntime,
  readHooksManifest,
  syncAllHooks,
  syncRulesToRuntime,
} from "../lib/hooks.js";
import { writeConfig } from "../lib/config.js";
import { writeRegistry } from "../lib/registry.js";

describe("hooks", () => {
  let tmpHome;
  let tmpGum;
  let moduleHooks;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "gum-home-"));
    tmpGum = path.join(tmpHome, ".gum");
    fs.mkdirSync(tmpGum, { recursive: true });
    fs.mkdirSync(path.join(tmpHome, ".claude"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpHome, ".claude", "settings.json"),
      JSON.stringify({}),
    );
    moduleHooks = {
      claude: {
        PostToolUse: [
          {
            matcher: "Edit|Write",
            hooks: [{ type: "command", command: "echo formatted" }],
          },
        ],
      },
    };
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it("syncHooksToRuntime merges hooks into settings.json", () => {
    syncHooksToRuntime("test-mod", moduleHooks, ["claude"], tmpGum, tmpHome);
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpHome, ".claude", "settings.json"), "utf-8"),
    );
    expect(settings.hooks).toBeDefined();
    expect(settings.hooks.PostToolUse).toHaveLength(1);
  });

  it("syncHooksToRuntime updates hooks-manifest.json", () => {
    syncHooksToRuntime("test-mod", moduleHooks, ["claude"], tmpGum, tmpHome);
    const manifest = readHooksManifest(tmpGum);
    expect(manifest["test-mod"]).toBeDefined();
    expect(manifest["test-mod"].claude).toBeDefined();
  });

  it("removeHooksFromRuntime cleans up hooks from settings", () => {
    syncHooksToRuntime("test-mod", moduleHooks, ["claude"], tmpGum, tmpHome);
    removeHooksFromRuntime("test-mod", ["claude"], tmpGum, tmpHome);
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpHome, ".claude", "settings.json"), "utf-8"),
    );
    const postToolUse = settings.hooks?.PostToolUse || [];
    expect(postToolUse).toHaveLength(0);
  });

  it("syncHooksToRuntime does not create duplicates when called twice", () => {
    syncHooksToRuntime("test-mod", moduleHooks, ["claude"], tmpGum, tmpHome);
    syncHooksToRuntime("test-mod", moduleHooks, ["claude"], tmpGum, tmpHome);
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpHome, ".claude", "settings.json"), "utf-8"),
    );
    // Should still be exactly 1 entry, not 2
    expect(settings.hooks.PostToolUse).toHaveLength(1);
  });

  it("syncAllHooks re-syncs cleanly without duplicates", () => {
    // Set up a proper gumDir with config and registry pointing to a module with hooks
    const modDir = path.join(tmpGum, "modules", "test-mod");
    fs.mkdirSync(modDir, { recursive: true });
    fs.writeFileSync(
      path.join(modDir, "hooks.json"),
      JSON.stringify(moduleHooks),
      "utf-8",
    );
    writeConfig(
      { runtimes: ["claude"], storage: path.join(tmpGum, "modules") },
      tmpGum,
    );
    writeRegistry(
      {
        storage: path.join(tmpGum, "modules"),
        modules: { "test-mod": modDir },
      },
      tmpGum,
    );

    // Sync once, then again
    syncAllHooks(tmpGum, tmpHome);
    syncAllHooks(tmpGum, tmpHome);

    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpHome, ".claude", "settings.json"), "utf-8"),
    );
    // Re-syncing twice should still produce exactly 1 entry
    expect(settings.hooks.PostToolUse).toHaveLength(1);
  });

  it("syncHooksToRuntime skips malformed hook entries (array instead of object)", () => {
    const malformedHooks = {
      claude: [{ event: "PostToolUse", command: "echo test" }],
    };
    // Should not throw
    syncHooksToRuntime(
      "malformed-mod",
      malformedHooks,
      ["claude"],
      tmpGum,
      tmpHome,
    );
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpHome, ".claude", "settings.json"), "utf-8"),
    );
    // No hooks should have been added since entries were not in correct format
    expect(settings.hooks.PostToolUse || []).toHaveLength(0);
  });

  it("syncAllHooks also syncs rules files", () => {
    const modDir = path.join(tmpGum, "modules", "rules-mod");
    fs.mkdirSync(modDir, { recursive: true });
    fs.writeFileSync(
      path.join(modDir, "module.yaml"),
      "name: rules-mod\nenabled: true\n",
      "utf-8",
    );
    fs.writeFileSync(
      path.join(modDir, "rules.md"),
      "# Rules for rules-mod\n",
      "utf-8",
    );
    writeConfig(
      { runtimes: ["claude"], storage: path.join(tmpGum, "modules") },
      tmpGum,
    );
    writeRegistry(
      {
        storage: path.join(tmpGum, "modules"),
        modules: { "rules-mod": modDir },
      },
      tmpGum,
    );

    syncAllHooks(tmpGum, tmpHome);

    const rulesFile = path.join(
      tmpHome,
      ".claude",
      "rules",
      "gum",
      "rules-mod.md",
    );
    expect(fs.existsSync(rulesFile)).toBe(true);
    expect(fs.readFileSync(rulesFile, "utf-8")).toContain(
      "Rules for rules-mod",
    );
  });

  it("does not touch hooks from other modules", () => {
    syncHooksToRuntime("mod-a", moduleHooks, ["claude"], tmpGum, tmpHome);
    const otherHooks = {
      claude: {
        PostToolUse: [
          {
            matcher: "Bash",
            hooks: [{ type: "command", command: "echo bash" }],
          },
        ],
      },
    };
    syncHooksToRuntime("mod-b", otherHooks, ["claude"], tmpGum, tmpHome);
    removeHooksFromRuntime("mod-a", ["claude"], tmpGum, tmpHome);
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpHome, ".claude", "settings.json"), "utf-8"),
    );
    expect(settings.hooks.PostToolUse).toHaveLength(1);
    expect(settings.hooks.PostToolUse[0].matcher).toBe("Bash");
  });
});

describe("syncRulesToRuntime", () => {
  let tmpHome;
  let tmpGum;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "gum-rules-"));
    tmpGum = path.join(tmpHome, ".gum");
    fs.mkdirSync(tmpGum, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  function makeModule(name, enabled, hasRules = true) {
    const modDir = path.join(tmpGum, "modules", name);
    fs.mkdirSync(modDir, { recursive: true });
    fs.writeFileSync(
      path.join(modDir, "module.yaml"),
      `name: ${name}\nenabled: ${enabled}\n`,
      "utf-8",
    );
    if (hasRules) {
      fs.writeFileSync(
        path.join(modDir, "rules.md"),
        `# Rules for ${name}\n`,
        "utf-8",
      );
    }
    return modDir;
  }

  it("copies enabled module rules.md into the runtime rules dir", () => {
    const modDir = makeModule("my-mod", true);
    writeConfig(
      { runtimes: ["claude"], storage: path.join(tmpGum, "modules") },
      tmpGum,
    );
    writeRegistry(
      { storage: path.join(tmpGum, "modules"), modules: { "my-mod": modDir } },
      tmpGum,
    );

    syncRulesToRuntime(tmpGum, tmpHome);

    const dest = path.join(tmpHome, ".claude", "rules", "gum", "my-mod.md");
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, "utf-8")).toContain("Rules for my-mod");
  });

  it("removes rules file for disabled module", () => {
    const enabledDir = makeModule("enabled-mod", true);
    const disabledDir = makeModule("disabled-mod", false);
    writeConfig(
      { runtimes: ["claude"], storage: path.join(tmpGum, "modules") },
      tmpGum,
    );
    writeRegistry(
      {
        storage: path.join(tmpGum, "modules"),
        modules: { "enabled-mod": enabledDir, "disabled-mod": disabledDir },
      },
      tmpGum,
    );

    // Place a stale rules file for the disabled module
    const gumRulesDir = path.join(tmpHome, ".claude", "rules", "gum");
    fs.mkdirSync(gumRulesDir, { recursive: true });
    fs.writeFileSync(
      path.join(gumRulesDir, "disabled-mod.md"),
      "stale content",
      "utf-8",
    );

    syncRulesToRuntime(tmpGum, tmpHome);

    expect(fs.existsSync(path.join(gumRulesDir, "enabled-mod.md"))).toBe(true);
    expect(fs.existsSync(path.join(gumRulesDir, "disabled-mod.md"))).toBe(
      false,
    );
  });

  it("syncs rules for all configured runtimes", () => {
    const modDir = makeModule("multi-mod", true);
    writeConfig(
      { runtimes: ["claude", "gemini"], storage: path.join(tmpGum, "modules") },
      tmpGum,
    );
    writeRegistry(
      {
        storage: path.join(tmpGum, "modules"),
        modules: { "multi-mod": modDir },
      },
      tmpGum,
    );

    syncRulesToRuntime(tmpGum, tmpHome);

    expect(
      fs.existsSync(
        path.join(tmpHome, ".claude", "rules", "gum", "multi-mod.md"),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(tmpHome, ".gemini", "rules", "gum", "multi-mod.md"),
      ),
    ).toBe(true);
  });

  it("skips modules without rules.md", () => {
    const modDir = makeModule("no-rules-mod", true, false);
    writeConfig(
      { runtimes: ["claude"], storage: path.join(tmpGum, "modules") },
      tmpGum,
    );
    writeRegistry(
      {
        storage: path.join(tmpGum, "modules"),
        modules: { "no-rules-mod": modDir },
      },
      tmpGum,
    );

    syncRulesToRuntime(tmpGum, tmpHome);

    const dest = path.join(
      tmpHome,
      ".claude",
      "rules",
      "gum",
      "no-rules-mod.md",
    );
    expect(fs.existsSync(dest)).toBe(false);
  });
});
