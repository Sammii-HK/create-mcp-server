import type { ProjectConfig } from "../../scaffold.js";

export function summariseTool(_config: ProjectConfig): string {
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

      const points = sentences.slice(0, maxPoints).map((s) => \`• \${s}\`);

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
