import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { scaffold, detectPackageManager } from "../dist/scaffold.js";

const base = () => mkdtempSync(join(tmpdir(), "mcp-scaffold-proof-"));
const config = (name, tools = ["hello"]) => ({
  name,
  description: "An example server",
  tools,
});
const offline = (cwd) => ({ cwd, install: false, git: false });

test("positional names reject traversal and source injection before prompting or creating files", () => {
  const cwd = base();
  for (const name of [
    "../escape",
    "/tmp/escape",
    ".",
    "..",
    "-server",
    "two words",
    'quote";throw Error(1);',
    "name\nother",
    "a".repeat(215),
  ]) {
    const result = spawnSync(
      process.execPath,
      [resolve("dist/index.js"), name],
      { cwd, encoding: "utf8", timeout: 5000 },
    );
    assert.equal(result.status, 1, name);
    assert.match(result.stderr, /lowercase letters/);
  }
  assert.deepEqual(readdirSync(cwd), []);
});

test("direct scaffolding validates the target and examples before writing anything", async () => {
  const cwd = base();
  await assert.rejects(
    scaffold(config("../escape"), offline(cwd)),
    /lowercase letters/,
  );
  for (const tool of ["constructor", "__proto__", "unknown"])
    await assert.rejects(
      scaffold(config("safe-server", [tool]), offline(cwd)),
      /supported example tools/,
    );
  assert.deepEqual(readdirSync(cwd), []);
});

test("existing directories and symlinks are preserved rather than overwritten", async () => {
  const cwd = base(),
    existing = join(cwd, "existing");
  mkdirSync(existing);
  writeFileSync(join(existing, "keep.txt"), "owner content");
  await assert.rejects(
    scaffold(config("existing"), offline(cwd)),
    /already exists/,
  );
  symlinkSync(existing, join(cwd, "linked"));
  await assert.rejects(
    scaffold(config("linked"), offline(cwd)),
    /already exists/,
  );
  assert.equal(
    readFileSync(join(existing, "keep.txt"), "utf8"),
    "owner content",
  );
});

test("a generated project contains each selected example once, preserves description text and offers real watch mode", async () => {
  const cwd = base(),
    description = 'Quotes "here", a slash \\ and\na second line';
  const result = await scaffold(
    {
      ...config("complete-server", [
        "hello",
        "calculator",
        "notes",
        "summarise",
        "hello",
      ]),
      description,
    },
    offline(cwd),
  );
  assert.equal(result.directory, join(cwd, "complete-server"));
  assert.equal(result.dependenciesInstalled, false);
  assert.equal(result.gitInitialised, false);
  const pkg = JSON.parse(
    readFileSync(join(result.directory, "package.json"), "utf8"),
  );
  assert.equal(pkg.description, description);
  assert.equal(pkg.scripts.dev, "tsx watch src/index.ts");
  assert.equal(readdirSync(join(result.directory, "src/tools")).length, 4);
  const source = readFileSync(join(result.directory, "src/index.ts"), "utf8");
  assert.equal((source.match(/registerHello\(server\)/g) || []).length, 1);
  assert.ok(!existsSync(join(result.directory, ".git")));
});

test("dependency failure preserves the usable project and explains the recovery instead of starting git", async () => {
  const cwd = base(),
    calls = [];
  await assert.rejects(
    scaffold(config("retry-server"), {
      cwd,
      git: true,
      packageManager: "npm",
      runCommand(command, args) {
        calls.push([command, args]);
        throw new Error("registry unavailable");
      },
    }),
    /files were kept.*npm install/i,
  );
  assert.deepEqual(calls, [["npm", ["install"]]]);
  assert.equal(
    JSON.parse(readFileSync(join(cwd, "retry-server/package.json"), "utf8"))
      .name,
    "retry-server",
  );
  assert.ok(existsSync(join(cwd, "retry-server/src/index.ts")));
});

test("installs with the package manager that launched the CLI", () => {
  assert.equal(detectPackageManager("pnpm/10.34.9 npm/? node/v23.7.0 darwin arm64"), "pnpm");
  assert.equal(detectPackageManager("npm/10.9.2 node/v23.7.0 darwin arm64 workspaces/false"), "npm");
  assert.equal(detectPackageManager("yarn/1.22.22 npm/? node/v23.7.0"), "npm");
  assert.equal(detectPackageManager(""), "npm");
});

test("pnpm projects pre-approve esbuild so newer pnpm finishes the install", async () => {
  const cwd = base();
  await scaffold(config("pnpm-server"), { ...offline(cwd), packageManager: "pnpm" });
  const workspace = readFileSync(join(cwd, "pnpm-server", "pnpm-workspace.yaml"), "utf8");
  assert.match(workspace, /onlyBuiltDependencies:\n  - esbuild/);
  assert.match(workspace, /allowBuilds:\n  esbuild: true/);
  await scaffold(config("npm-server"), offline(cwd));
  assert.equal(existsSync(join(cwd, "npm-server", "pnpm-workspace.yaml")), false);
});
