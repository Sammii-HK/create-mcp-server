import prompts from "prompts";
import pc from "picocolors";
import { scaffold } from "./scaffold.js";

const EXAMPLES = [
  { title: "hello", value: "hello", description: "Simple tool with no parameters", selected: true },
  { title: "calculator", value: "calculator", description: "Tool with Zod input validation", selected: true },
  { title: "notes", value: "notes", description: "Resource provider (note:// URIs)", selected: false },
  { title: "summarise", value: "summarise", description: "Prompt template", selected: false },
];

async function main() {
  console.log();
  console.log(pc.bold("init-mcp-server") + pc.dim(" v1.0.0"));
  console.log();

  // Allow project name as first arg
  const argName = process.argv[2];

  const response = await prompts(
    [
      {
        type: argName ? null : "text",
        name: "name",
        message: "Project name",
        initial: "my-mcp-server",
        validate: (v: string) =>
          /^[a-z0-9-]+$/.test(v) || "Use lowercase letters, numbers, and hyphens only",
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
    { onCancel: () => process.exit(0) }
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
  console.log("  To use with Claude Code, add to " + pc.bold(".mcp.json") + ":");
  console.log();
  console.log(pc.dim(`    {`));
  console.log(pc.dim(`      "mcpServers": {`));
  console.log(pc.dim(`        "${name}": {`));
  console.log(pc.dim(`          "command": "node",`));
  console.log(pc.dim(`          "args": ["${process.cwd()}/${name}/dist/index.js"]`));
  console.log(pc.dim(`        }`));
  console.log(pc.dim(`      }`));
  console.log(pc.dim(`    }`));
  console.log();
}

main().catch((err) => {
  console.error(pc.red("Error:"), err.message);
  process.exit(1);
});
