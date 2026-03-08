import type { ProjectConfig } from "../scaffold.js";

export function readme(config: ProjectConfig): string {
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
