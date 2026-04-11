// tests/install.test.js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const INSTALLER = path.resolve("bin/install.js");

describe("install (non-interactive)", () => {
  let tmpHome;
  let tmpStorage;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "gum-install-"));
    tmpStorage = path.join(tmpHome, "gum-modules");
    fs.mkdirSync(tmpStorage, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it("creates config, registry, and integration file", () => {
    execFileSync(
      "node",
      [INSTALLER, "--claude", "--storage", tmpStorage, "--home", tmpHome],
      { encoding: "utf-8" },
    );

    expect(fs.existsSync(path.join(tmpHome, ".gum", "config.yaml"))).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, ".gum", "registry.json"))).toBe(
      true,
    );
    expect(
      fs.existsSync(path.join(tmpHome, ".claude", "rules", "gum.md")),
    ).toBe(true);
  });

  it("creates rules/gum/ subdirectory for each installed runtime", () => {
    execFileSync(
      "node",
      [
        INSTALLER,
        "--claude",
        "--gemini",
        "--storage",
        tmpStorage,
        "--home",
        tmpHome,
      ],
      { encoding: "utf-8" },
    );

    expect(fs.existsSync(path.join(tmpHome, ".claude", "rules", "gum"))).toBe(
      true,
    );
    expect(
      fs.statSync(path.join(tmpHome, ".claude", "rules", "gum")).isDirectory(),
    ).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, ".gemini", "rules", "gum"))).toBe(
      true,
    );
    expect(
      fs.statSync(path.join(tmpHome, ".gemini", "rules", "gum")).isDirectory(),
    ).toBe(true);
  });

  it("supports multiple runtimes", () => {
    execFileSync(
      "node",
      [
        INSTALLER,
        "--claude",
        "--gemini",
        "--storage",
        tmpStorage,
        "--home",
        tmpHome,
      ],
      { encoding: "utf-8" },
    );

    expect(
      fs.existsSync(path.join(tmpHome, ".claude", "rules", "gum.md")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpHome, ".gemini", "rules", "gum.md")),
    ).toBe(true);
  });

  it("--help flag outputs usage info", () => {
    const out = execFileSync("node", [INSTALLER, "--help"], {
      encoding: "utf-8",
    });
    expect(out).toContain("USAGE");
    expect(out).toContain("FLAGS");
    expect(out).toContain("--all");
    expect(out).toContain("--uninstall");
  });

  it("--all flag installs integration files for all runtimes", () => {
    execFileSync(
      "node",
      [INSTALLER, "--all", "--storage", tmpStorage, "--home", tmpHome],
      { encoding: "utf-8" },
    );

    // Spot-check several runtimes are created
    expect(
      fs.existsSync(path.join(tmpHome, ".claude", "rules", "gum.md")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpHome, ".gemini", "rules", "gum.md")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpHome, ".opencode", "rules", "gum.md")),
    ).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, ".codex", "rules", "gum.md"))).toBe(
      true,
    );
  });

  it("--config-dir flag uses custom path for the given runtime", () => {
    const customDir = path.join(tmpHome, "custom-claude");
    fs.mkdirSync(customDir, { recursive: true });
    execFileSync(
      "node",
      [
        INSTALLER,
        "--claude",
        "--storage",
        tmpStorage,
        "--home",
        tmpHome,
        "--config-dir",
        `claude=${customDir}`,
      ],
      { encoding: "utf-8" },
    );

    // Integration file should be in the custom dir, not the default .claude location
    expect(
      fs.existsSync(path.join(customDir, ".claude", "rules", "gum.md")),
    ).toBe(true);
    // Default location should NOT have the file
    expect(
      fs.existsSync(path.join(tmpHome, ".claude", "rules", "gum.md")),
    ).toBe(false);
  });

  it("CLAUDE_CONFIG_DIR env var overrides config directory", () => {
    const envDir = path.join(tmpHome, "env-claude");
    fs.mkdirSync(envDir, { recursive: true });
    execFileSync(
      "node",
      [INSTALLER, "--claude", "--storage", tmpStorage, "--home", tmpHome],
      {
        encoding: "utf-8",
        env: { ...process.env, CLAUDE_CONFIG_DIR: envDir },
      },
    );

    // Integration file should be placed relative to the env-override dir
    expect(fs.existsSync(path.join(envDir, ".claude", "rules", "gum.md"))).toBe(
      true,
    );
    expect(
      fs.existsSync(path.join(tmpHome, ".claude", "rules", "gum.md")),
    ).toBe(false);
  });

  it("--starters flag installs starter modules into storage", () => {
    execFileSync(
      "node",
      [
        INSTALLER,
        "--claude",
        "--storage",
        tmpStorage,
        "--home",
        tmpHome,
        "--starters",
      ],
      { encoding: "utf-8" },
    );

    // Starter modules should exist in storage
    expect(
      fs.existsSync(path.join(tmpStorage, "clean-commits", "module.yaml")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpStorage, "clean-commits", "rules.md")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpStorage, "auto-format", "module.yaml")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpStorage, "scope-guard", "module.yaml")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpStorage, "safety-net", "module.yaml")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpStorage, "no-fluff", "module.yaml")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpStorage, "test-gate", "module.yaml")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpStorage, "security-basics", "module.yaml")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpStorage, "enforce-tdd", "module.yaml")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpStorage, "use-frontend-design", "module.yaml")),
    ).toBe(true);

    // Should be registered in registry
    const reg = JSON.parse(
      fs.readFileSync(path.join(tmpHome, ".gum", "registry.json"), "utf-8"),
    );
    expect(reg.modules["clean-commits"]).toBeDefined();
    expect(reg.modules["auto-format"]).toBeDefined();
    expect(reg.modules["scope-guard"]).toBeDefined();
    expect(reg.modules["safety-net"]).toBeDefined();
    expect(reg.modules["enforce-tdd"]).toBeDefined();
  });

  it("without --starters flag does not install starters in non-interactive mode", () => {
    execFileSync(
      "node",
      [INSTALLER, "--claude", "--storage", tmpStorage, "--home", tmpHome],
      { encoding: "utf-8" },
    );

    // No starters should be installed
    expect(fs.existsSync(path.join(tmpStorage, "clean-commits"))).toBe(false);
    expect(fs.existsSync(path.join(tmpStorage, "auto-format"))).toBe(false);
  });

  it("--starters does not overwrite existing modules", () => {
    // Create a module with same name as starter
    const existingDir = path.join(tmpStorage, "clean-commits");
    fs.mkdirSync(existingDir, { recursive: true });
    fs.writeFileSync(path.join(existingDir, "rules.md"), "custom rules");

    execFileSync(
      "node",
      [
        INSTALLER,
        "--claude",
        "--storage",
        tmpStorage,
        "--home",
        tmpHome,
        "--starters",
      ],
      { encoding: "utf-8" },
    );

    // Should keep original content, not overwrite
    const rules = fs.readFileSync(path.join(existingDir, "rules.md"), "utf-8");
    expect(rules).toBe("custom rules");
  });

  it("adds GUM permissions to Claude Code settings.json", () => {
    execFileSync(
      "node",
      [INSTALLER, "--claude", "--storage", tmpStorage, "--home", tmpHome],
      { encoding: "utf-8" },
    );

    const settingsPath = path.join(tmpHome, ".claude", "settings.json");
    expect(fs.existsSync(settingsPath)).toBe(true);
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    expect(settings.permissions).toBeDefined();
    const gumDir = path.join(tmpHome, ".gum");
    expect(settings.permissions.allow).toContain(
      `Read(${path.resolve(gumDir)}/**)`,
    );
    expect(settings.permissions.allow).toContain(
      `Write(${path.resolve(gumDir)}/**)`,
    );
    expect(
      settings.permissions.allow.some((p) =>
        p.includes(path.resolve(tmpStorage)),
      ),
    ).toBe(true);
  });

  it("does not duplicate permissions on reinstall", () => {
    execFileSync(
      "node",
      [INSTALLER, "--claude", "--storage", tmpStorage, "--home", tmpHome],
      { encoding: "utf-8" },
    );
    execFileSync(
      "node",
      [INSTALLER, "--claude", "--storage", tmpStorage, "--home", tmpHome],
      { encoding: "utf-8" },
    );

    const settingsPath = path.join(tmpHome, ".claude", "settings.json");
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    const gumDir = path.join(tmpHome, ".gum");
    const gumReadCount = settings.permissions.allow.filter(
      (p) => p === `Read(${path.resolve(gumDir)}/**)`,
    ).length;
    expect(gumReadCount).toBe(1);
  });

  it("preserves existing settings when adding permissions", () => {
    // Create settings with existing content
    const settingsDir = path.join(tmpHome, ".claude");
    fs.mkdirSync(settingsDir, { recursive: true });
    fs.writeFileSync(
      path.join(settingsDir, "settings.json"),
      JSON.stringify({
        enabledPlugins: { "some-plugin": true },
      }),
    );

    execFileSync(
      "node",
      [INSTALLER, "--claude", "--storage", tmpStorage, "--home", tmpHome],
      { encoding: "utf-8" },
    );

    const settings = JSON.parse(
      fs.readFileSync(path.join(settingsDir, "settings.json"), "utf-8"),
    );
    expect(settings.enabledPlugins["some-plugin"]).toBe(true);
    const gumDir = path.join(tmpHome, ".gum");
    expect(settings.permissions.allow).toContain(
      `Read(${path.resolve(gumDir)}/**)`,
    );
  });

  it("auto-discovers existing modules in storage", () => {
    // Create a module manually in storage before install
    const modDir = path.join(tmpStorage, "pre-existing");
    fs.mkdirSync(modDir, { recursive: true });
    fs.writeFileSync(
      path.join(modDir, "module.yaml"),
      "name: pre-existing\nenabled: true\n",
    );
    fs.writeFileSync(path.join(modDir, "rules.md"), "- some rule\n");

    execFileSync(
      "node",
      [INSTALLER, "--claude", "--storage", tmpStorage, "--home", tmpHome],
      { encoding: "utf-8" },
    );

    const reg = JSON.parse(
      fs.readFileSync(path.join(tmpHome, ".gum", "registry.json"), "utf-8"),
    );
    expect(reg.modules["pre-existing"]).toBe(modDir);
  });

  it("auto-discover skips folders without module.yaml", () => {
    // Create a folder without module.yaml
    fs.mkdirSync(path.join(tmpStorage, "not-a-module"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpStorage, "not-a-module", "random.txt"),
      "hello",
    );

    execFileSync(
      "node",
      [INSTALLER, "--claude", "--storage", tmpStorage, "--home", tmpHome],
      { encoding: "utf-8" },
    );

    const reg = JSON.parse(
      fs.readFileSync(path.join(tmpHome, ".gum", "registry.json"), "utf-8"),
    );
    expect(reg.modules["not-a-module"]).toBeUndefined();
  });

  it("delegates subcommands to cli.js", () => {
    // Install first
    execFileSync(
      "node",
      [INSTALLER, "--claude", "--storage", tmpStorage, "--home", tmpHome],
      { encoding: "utf-8" },
    );

    // Run list via installer entry point — should delegate to cli.js
    const out = execFileSync(
      "node",
      [INSTALLER, "list", "--gum-dir", path.join(tmpHome, ".gum")],
      { encoding: "utf-8" },
    );

    expect(out).toContain("No modules");
  });

  it("--help shows COMMANDS section", () => {
    const out = execFileSync("node", [INSTALLER, "--help"], {
      encoding: "utf-8",
    });
    expect(out).toContain("COMMANDS");
    expect(out).toContain("npx get-gum list");
    expect(out).toContain("npx get-gum sync");
    expect(out).toContain("npx get-gum doctor");
    expect(out).toContain("npx get-gum toggle");
  });

  it("detects existing config on second install", () => {
    // First install
    execFileSync(
      "node",
      [INSTALLER, "--claude", "--storage", tmpStorage, "--home", tmpHome],
      { encoding: "utf-8" },
    );

    // Second install
    const out = execFileSync(
      "node",
      [INSTALLER, "--claude", "--storage", tmpStorage, "--home", tmpHome],
      { encoding: "utf-8" },
    );

    expect(out.toLowerCase()).toContain("existing");
  });
});
