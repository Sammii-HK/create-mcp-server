# create-mcp-server

Scaffold a new [Model Context Protocol](https://modelcontextprotocol.io/) server in seconds.

```bash
npx create-mcp-server
```

## What you get

- TypeScript project with the MCP SDK wired up
- Stdio transport ready to go
- Optional example tools (hello, calculator, notes, summarise)
- Dev mode with auto-reload via `tsx --watch`
- Ready-to-use config snippets for Claude Code and Claude Desktop

## Usage

Run the CLI and follow the prompts:

```bash
npx create-mcp-server
```

Or pass a project name directly:

```bash
npx create-mcp-server my-server
```

You'll be asked to pick which example tools to include:

| Tool | What it demonstrates |
|------|---------------------|
| **hello** | Minimal tool with no parameters |
| **calculator** | Zod input validation (add, multiply) |
| **notes** | Stateful tool (create and list notes) |
| **summarise** | Text processing with optional parameters |

## After scaffolding

```bash
cd my-server
npm run dev          # Start with auto-reload
npm run build        # Compile TypeScript
npm start            # Run compiled server
```

## Adding your own tools

Create a file in `src/tools/` and register it in `src/index.ts`:

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerMyTool(server: McpServer) {
  server.tool(
    "my-tool",
    "What it does",
    { input: z.string().describe("The input") },
    async ({ input }) => ({
      content: [{ type: "text", text: `Result: ${input}` }],
    })
  );
}
```

## Licence

MIT
