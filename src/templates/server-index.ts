import type { ProjectConfig } from "../scaffold.js";

const TOOL_IMPORTS: Record<string, { importName: string; registerName: string }> = {
  hello: { importName: "registerHello", registerName: "registerHello" },
  calculator: { importName: "registerCalculator", registerName: "registerCalculator" },
  notes: { importName: "registerNotes", registerName: "registerNotes" },
  summarise: { importName: "registerSummarise", registerName: "registerSummarise" },
};

const TOOL_FILES: Record<string, string> = {
  hello: "./tools/hello.js",
  calculator: "./tools/calculator.js",
  notes: "./tools/notes.js",
  summarise: "./tools/summarise.js",
};

export function serverIndex(config: ProjectConfig): string {
  const imports = config.tools
    .filter((t) => TOOL_IMPORTS[t])
    .map((t) => `import { ${TOOL_IMPORTS[t].importName} } from "${TOOL_FILES[t]}";`)
    .join("\n");

  const registrations = config.tools
    .filter((t) => TOOL_IMPORTS[t])
    .map((t) => `${TOOL_IMPORTS[t].registerName}(server);`)
    .join("\n");

  return `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
${imports}

const server = new McpServer({
  name: "${config.name}",
  version: "0.1.0",
});

// Register tools
${registrations}

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
`;
}
