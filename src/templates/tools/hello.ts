import type { ProjectConfig } from "../../scaffold.js";

export function helloTool(_config: ProjectConfig): string {
  return `import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerHello(server: McpServer) {
  server.tool("hello", "Say hello", {}, async () => ({
    content: [{ type: "text", text: "Hello from your MCP server!" }],
  }));
}
`;
}
