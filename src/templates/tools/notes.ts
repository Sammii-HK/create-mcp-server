import type { ProjectConfig } from "../../scaffold.js";

export function notesTool(_config: ProjectConfig): string {
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
