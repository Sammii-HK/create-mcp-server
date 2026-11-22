#!/usr/bin/env node

// src/scaffold.ts
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";

// src/project.ts
import { isAbsolute, relative, resolve, sep } from "path";
var EXAMPLE_TOOLS = [
  "hello",
  "calculator",
  "notes",
  "summarise"
];
function validateProjectName(name) {
  if (!name || name.length > 214 || !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    return "Use 1\u2013214 lowercase letters, numbers or hyphens, starting with a letter or number";
  }
  return true;
}
function projectDirectory(cwd, name) {
  const valid = validateProjectName(name);
  if (valid !== true) throw new Error(valid);
  const parent = resolve(cwd);
  const directory = resolve(parent, name);
  const child = relative(parent, directory);
  if (!child || child === ".." || child.startsWith(".." + sep) || isAbsolute(child)) {
    throw new Error(
      "The project must be a new directory inside the current folder"
    );
  }
  return directory;
}

// src/scaffold.ts
import { execFileSync } from "child_process";
import pc from "picocolors";

// src/templates/package-json.ts
function packageJson(config) {
  const pkg = {
    name: config.name,
    version: "0.1.0",
    description: config.description,
    type: "module",
    main: "dist/index.js",
    scripts: {
      build: "tsc",
      start: "node dist/index.js",
      dev: "tsx watch src/index.ts"
    },
    dependencies: {
      "@modelcontextprotocol/sdk": "^1.32.2",
      zod: "^4.6.6"
    },
    devDependencies: {
      "@types/node": "^22.0.0",
      tsx: "^4.19.0",
      typescript: "^5.7.0"
    }
  };
  return JSON.stringify(pkg, null, 2) + "\n";
}

// src/templates/tsconfig.ts
function tsconfig() {
  const config = {
    compilerOptions: {
      target: "ES2022",
      module: "ES2022",
      moduleResolution: "bundler",
      outDir: "dist",
      rootDir: "src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true
    },
    include: ["src"]
  };
  return JSON.stringify(config, null, 2) + "\n";
}

// src/templates/gitignore.ts
function gitignore() {
  return `node_modules/
dist/
.env
*.tsbuildinfo
`;
}

// src/templates/readme.ts
function readme(config) {
  return `# ${config.name}

${config.description}

Built with the [Model Context Protocol](https://modelcontextprotocol.io/) SDK.

## Getting started

\`\`\`bash
npm run dev          # Start in development mode (auto-reloads)
npm run build        # Compile TypeScript
npm start            # Run compiled server
\`\`\`

## Using with Claude Code

Add to your \`.mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "${config.name}": {
      "command": "node",
      "args": ["path/to/${config.name}/dist/index.js"]
    }
  }
}
\`\`\`

## Using with Claude Desktop

Add to your Claude Desktop config (\`~/Library/Application Support/Claude/claude_desktop_config.json\`):

\`\`\`json
{
  "mcpServers": {
    "${config.name}": {
      "command": "node",
      "args": ["path/to/${config.name}/dist/index.js"]
    }
  }
}
\`\`\`

## Adding tools

Create a new file in \`src/tools/\` and register it in \`src/index.ts\`:

\`\`\`typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerMyTool(server: McpServer) {
  server.tool(
    "my-tool",
    "Description of what it does",
    { input: z.string().describe("The input") },
    async ({ input }) => ({
      content: [{ type: "text", text: \`Result: \${input}\` }],
    })
  );
}
\`\`\`
`;
}

// src/templates/server-index.ts
var TOOL_IMPORTS = {
  hello: { importName: "registerHello", registerName: "registerHello" },
  calculator: {
    importName: "registerCalculator",
    registerName: "registerCalculator"
  },
  notes: { importName: "registerNotes", registerName: "registerNotes" },
  summarise: {
    importName: "registerSummarise",
    registerName: "registerSummarise"
  }
};
var TOOL_FILES = {
  hello: "./tools/hello.js",
  calculator: "./tools/calculator.js",
  notes: "./tools/notes.js",
  summarise: "./tools/summarise.js"
};
function serverIndex(config) {
  const imports = config.tools.filter((t) => TOOL_IMPORTS[t]).map(
    (t) => `import { ${TOOL_IMPORTS[t].importName} } from "${TOOL_FILES[t]}";`
  ).join("\n");
  const registrations = config.tools.filter((t) => TOOL_IMPORTS[t]).map((t) => `${TOOL_IMPORTS[t].registerName}(server);`).join("\n");
  return `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
${imports}

const server = new McpServer({
  name: ${JSON.stringify(config.name)},
  version: "0.1.0",
});

// Register tools
${registrations}

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
`;
}

// src/templates/tools/hello.ts
function helloTool(_config) {
  return `import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerHello(server: McpServer) {
  server.tool("hello", "Say hello", {}, async () => ({
    content: [{ type: "text", text: "Hello from your MCP server!" }],
  }));
}
`;
}

// src/templates/tools/calculator.ts
function calculatorTool(_config) {
  return `import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerCalculator(server: McpServer) {
  server.tool(
    "add",
    "Add two numbers together",
    {
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    },
    async ({ a, b }) => ({
      content: [{ type: "text", text: String(a + b) }],
    })
  );

  server.tool(
    "multiply",
    "Multiply two numbers",
    {
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    },
    async ({ a, b }) => ({
      content: [{ type: "text", text: String(a * b) }],
    })
  );
}
`;
}

// src/templates/tools/notes.ts
function notesTool(_config) {
  return `import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const notes = new Map<string, string>();

export function registerNotes(server: McpServer) {
  server.tool(
    "create-note",
    "Create or update a note",
    {
      title: z.string().describe("Note title"),
      content: z.string().describe("Note content"),
    },
    async ({ title, content }) => {
      notes.set(title, content);
      return {
        content: [{ type: "text", text: \`Note "\${title}" saved.\` }],
      };
    }
  );

  server.tool(
    "list-notes",
    "List all saved notes",
    {},
    async () => {
      if (notes.size === 0) {
        return { content: [{ type: "text", text: "No notes yet." }] };
      }
      const list = [...notes.entries()]
        .map(([title, content]) => \`## \${title}\\n\${content}\`)
        .join("\\n\\n");
      return { content: [{ type: "text", text: list }] };
    }
  );
}
`;
}

// src/templates/tools/summarise.ts
function summariseTool(_config) {
  return `import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerSummarise(server: McpServer) {
  server.tool(
    "summarise",
    "Summarise a block of text into key bullet points",
    {
      text: z.string().describe("The text to summarise"),
      maxPoints: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of bullet points"),
    },
    async ({ text, maxPoints }) => {
      const sentences = text
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const points = sentences.slice(0, maxPoints).map((s) => \`\u2022 \${s}\`);

      return {
        content: [
          {
            type: "text",
            text: points.length
              ? points.join("\\n")
              : "No content to summarise.",
          },
        ],
      };
    }
  );
}
`;
}

// src/scaffold.ts
var TOOL_FILES2 = {
  hello: { filename: "hello.ts", template: helloTool },
  calculator: { filename: "calculator.ts", template: calculatorTool },
  notes: { filename: "notes.ts", template: notesTool },
  summarise: { filename: "summarise.ts", template: summariseTool }
};
function write(dir, path, content) {
  const full = join(dir, path);
  const parent = dirname(full);
  mkdirSync(parent, { recursive: true });
  writeFileSync(full, content);
}
async function scaffold(config, options = {}) {
  const dir = projectDirectory(options.cwd ?? process.cwd(), config.name);
  if (typeof config.description !== "string" || !Array.isArray(config.tools) || config.tools.some(
    (tool) => !EXAMPLE_TOOLS.includes(tool)
  )) {
    throw new Error(
      "Choose only the supported example tools: " + EXAMPLE_TOOLS.join(", ")
    );
  }
  config = { ...config, tools: [...new Set(config.tools)] };
  const run = options.runCommand ?? ((command, args, settings) => {
    execFileSync(command, args, settings);
  });
  if (existsSync(dir)) {
    throw new Error(`Directory "${config.name}" already exists`);
  }
  console.log(`  Creating ${pc.bold(config.name)}...`);
  mkdirSync(dir);
  write(dir, "package.json", packageJson(config));
  write(dir, "tsconfig.json", tsconfig());
  write(dir, ".gitignore", gitignore());
  write(dir, "README.md", readme(config));
  write(dir, "src/index.ts", serverIndex(config));
  for (const tool of config.tools) {
    const def = TOOL_FILES2[tool];
    if (def) {
      write(dir, `src/tools/${def.filename}`, def.template(config));
    }
  }
  const pm = options.packageManager ?? (options.install === false ? "npm" : detectPackageManager());
  if (pm === "pnpm") {
    write(dir, "pnpm-workspace.yaml", PNPM_WORKSPACE);
  }
  const dependenciesInstalled = options.install !== false;
  if (dependenciesInstalled) {
    console.log("  Installing dependencies...");
    try {
      run(pm, ["install"], { cwd: dir, stdio: "ignore" });
    } catch {
      throw new Error(
        `Project files were kept in "${config.name}", but dependencies could not be installed. Open that folder and run "${pm} install" to continue.`
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
        stdio: "ignore"
      });
      gitInitialised = true;
    } catch {
      console.log("  Git setup was skipped. Your project files are ready.");
    }
  }
  return { directory: dir, dependenciesInstalled, gitInitialised };
}
var PNPM_WORKSPACE = `onlyBuiltDependencies:
  - esbuild
allowBuilds:
  esbuild: true
`;
function detectPackageManager(userAgent = process.env.npm_config_user_agent ?? "") {
  return userAgent.startsWith("pnpm/") ? "pnpm" : "npm";
}
export {
  detectPackageManager,
  scaffold
};
