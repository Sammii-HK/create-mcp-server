import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { EXAMPLE_TOOLS, projectDirectory } from "./project.js";
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

const TOOL_FILES: Record<
  string,
  { filename: string; template: (c: ProjectConfig) => string }
> = {
  hello: { filename: "hello.ts", template: helloTool },
  calculator: { filename: "calculator.ts", template: calculatorTool },
  notes: { filename: "notes.ts", template: notesTool },
  summarise: { filename: "summarise.ts", template: summariseTool },
};

function write(dir: string, path: string, content: string) {
  const full = join(dir, path);
  const parent = dirname(full);
  mkdirSync(parent, { recursive: true });
  writeFileSync(full, content);
}

export interface ScaffoldOptions {
  cwd?: string;
  install?: boolean;
  git?: boolean;
  packageManager?: "npm" | "pnpm";
  runCommand?: (
    command: string,
    args: string[],
    options: { cwd: string; stdio: "ignore" },
  ) => void;
}

export async function scaffold(
  config: ProjectConfig,
  options: ScaffoldOptions = {},
) {
  const dir = projectDirectory(options.cwd ?? process.cwd(), config.name);
  if (
    typeof config.description !== "string" ||
    !Array.isArray(config.tools) ||
    config.tools.some(
      (tool) => !EXAMPLE_TOOLS.includes(tool as (typeof EXAMPLE_TOOLS)[number]),
    )
  ) {
    throw new Error(
      "Choose only the supported example tools: " + EXAMPLE_TOOLS.join(", "),
    );
  }
  config = { ...config, tools: [...new Set(config.tools)] };
  const run =
    options.runCommand ??
    ((command, args, settings) => {
      execFileSync(command, args, settings);
    });

  if (existsSync(dir)) {
    throw new Error(`Directory "${config.name}" already exists`);
  }

  console.log(`  Creating ${pc.bold(config.name)}...`);
  mkdirSync(dir);

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

  // Keep generated files recoverable when a package registry is unavailable.
  const pm =
    options.packageManager ??
    (options.install === false ? "npm" : detectPackageManager());
  if (pm === "pnpm") {
    // pnpm 10 and later stop the install until esbuild's build script (needed by tsx) is approved.
    write(dir, "pnpm-workspace.yaml", PNPM_WORKSPACE);
  }
  const dependenciesInstalled = options.install !== false;
  if (dependenciesInstalled) {
    console.log("  Installing dependencies...");
    try {
      run(pm, ["install"], { cwd: dir, stdio: "ignore" });
    } catch {
      throw new Error(
        `Project files were kept in "${config.name}", but dependencies could not be installed. Open that folder and run "${pm} install" to continue.`,
      );
    }
  }

  let gitInitialised = false;
  if (options.git !== false) {
    try {
      run("git", ["init"], { cwd: dir, stdio: "ignore" });
      run("git", ["add", "-A"], { cwd: dir, stdio: "ignore" });
      run("git", ["commit", "-m", "Initial commit"], {
        cwd: dir,
        stdio: "ignore",
      });
      gitInitialised = true;
    } catch {
      console.log("  Git setup was skipped. Your project files are ready.");
    }
  }
  return { directory: dir, dependenciesInstalled, gitInitialised };
}

// pnpm 10 reads onlyBuiltDependencies, pnpm 11 reads allowBuilds; each ignores the other.
const PNPM_WORKSPACE = `onlyBuiltDependencies:
  - esbuild
allowBuilds:
  esbuild: true
`;

/** Install with the package manager that launched the CLI (npx, pnpm dlx), not whichever happens to be installed. */
export function detectPackageManager(
  userAgent = process.env.npm_config_user_agent ?? "",
): "npm" | "pnpm" {
  return userAgent.startsWith("pnpm/") ? "pnpm" : "npm";
}
