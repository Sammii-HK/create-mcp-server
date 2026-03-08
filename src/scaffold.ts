import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import pc from "picocolors";
import { packageJson } from "./templates/package-json.js";
import { tsconfig } from "./templates/tsconfig.js";
import { gitignore } from "./templates/gitignore.js";
import { readme } from "./templates/readme.js";
import { serverIndex } from "./templates/server-index.js";
import { helloTool } from "./templates/tools/hello.js";
import { calculatorTool } from "./templates/tools/calculator.js";
import { notesTool } from "./templates/tools/notes.js";
import { summariseTool } from "./templates/tools/summarise.js";

export interface ProjectConfig {
  name: string;
  description: string;
  tools: string[];
}

const TOOL_FILES: Record<string, { filename: string; template: (c: ProjectConfig) => string }> = {
  hello: { filename: "hello.ts", template: helloTool },
  calculator: { filename: "calculator.ts", template: calculatorTool },
  notes: { filename: "notes.ts", template: notesTool },
  summarise: { filename: "summarise.ts", template: summariseTool },
};

function write(dir: string, path: string, content: string) {
  const full = join(dir, path);
  const parent = full.substring(0, full.lastIndexOf("/"));
  mkdirSync(parent, { recursive: true });
  writeFileSync(full, content);
}

export async function scaffold(config: ProjectConfig) {
  const dir = join(process.cwd(), config.name);

  if (existsSync(dir)) {
    throw new Error(`Directory "${config.name}" already exists`);
  }

  console.log(`  Creating ${pc.bold(config.name)}...`);
  mkdirSync(dir, { recursive: true });

  // Root files
  write(dir, "package.json", packageJson(config));
  write(dir, "tsconfig.json", tsconfig());
  write(dir, ".gitignore", gitignore());
  write(dir, "README.md", readme(config));

  // Server entry
  write(dir, "src/index.ts", serverIndex(config));

  // Tool files
  for (const tool of config.tools) {
    const def = TOOL_FILES[tool];
    if (def) {
      write(dir, `src/tools/${def.filename}`, def.template(config));
    }
  }

  // Install deps
  console.log("  Installing dependencies...");
  const pm = detectPackageManager();
  execFileSync(pm, ["install"], { cwd: dir, stdio: "ignore" });

  // Init git
  try {
    execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["add", "-A"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", "Initial commit"], { cwd: dir, stdio: "ignore" });
  } catch {
    // git not available or failed, skip
  }
}

function detectPackageManager(): string {
  try {
    execFileSync("pnpm", ["--version"], { stdio: "ignore" });
    return "pnpm";
  } catch {
    return "npm";
  }
}
