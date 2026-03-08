import type { ProjectConfig } from "../../scaffold.js";

export function calculatorTool(_config: ProjectConfig): string {
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
