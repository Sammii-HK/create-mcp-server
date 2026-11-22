import prompts from "prompts";
import { join } from "node:path";
import { createRequire } from "node:module";
import pc from "picocolors";
import { scaffold } from "./scaffold.js";
import { validateProjectName } from "./project.js";

const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

const EXAMPLES = [
  {
    title: "hello",
    value: "hello",
    description: "Simple tool with no parameters",
    selected: true,
  },
  {
    title: "calculator",
    value: "calculator",
    description: "Tool with Zod input validation",
    selected: true,
  },
  {
    title: "notes",
    value: "notes",
    description: "Create and list notes in memory",
    selected: false,
  },
  {
    title: "summarise",
    value: "summarise",
    description: "Select sentences with an optional limit",
    selected: false,
  },
];

async function main() {
  console.log();
  console.log(pc.bold("init-mcp-server") + pc.dim(` v${version}`));
  console.log();

  // Allow project name as first arg
  const argName = process.argv[2];
  if (argName !== undefined) {
    const valid = validateProjectName(argName);
    if (valid !== true) throw new Error(valid);
  }

  const response = await prompts(
    [
      {
        type: argName ? null : "text",
        name: "name",
        message: "Project name",
        initial: "my-mcp-server",
        validate: validateProjectName,
      },
      {
        type: "text",
        name: "description",
        message: "Description",
        initial: "An MCP server",
      },
      {
        type: "multiselect",
        name: "tools",
        message: "Example tools to include",
        choices: EXAMPLES,
        hint: "Space to toggle, Enter to confirm",
      },
    ],
    { onCancel: () => process.exit(0) },
  );

  const name = argName || response.name;
  if (!name) process.exit(0);

  const config = {
    name,
    description: response.description || "An MCP server",
    tools: (response.tools as string[]) || ["hello"],
  };

  console.log();
  await scaffold(config);

  console.log();
  console.log(pc.green("Done!") + " Your MCP server is ready.");
  console.log();
  console.log("  Next steps:");
  console.log(pc.dim(`    cd ${name}`));
  console.log(pc.dim("    npm run dev          # Start in development mode"));
  console.log(pc.dim("    npm run build        # Compile TypeScript"));
  console.log();
  console.log(
    "  To use with Claude Code, add to " + pc.bold(".mcp.json") + ":",
  );
  console.log();
  const clientConfig = {
    mcpServers: {
      [name]: {
        command: "node",
        args: [join(process.cwd(), name, "dist", "index.js")],
      },
    },
  };
  console.log(pc.dim(JSON.stringify(clientConfig, null, 2)));
  console.log();
}

main().catch((err) => {
  console.error(pc.red("Error:"), err.message);
  process.exit(1);
});
