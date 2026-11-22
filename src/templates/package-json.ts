import type { ProjectConfig } from "../scaffold.js";

export function packageJson(config: ProjectConfig): string {
  const pkg = {
    name: config.name,
    version: "0.1.0",
    description: config.description,
    type: "module",
    main: "dist/index.js",
    scripts: {
      build: "tsc",
      start: "node dist/index.js",
      dev: "tsx watch src/index.ts",
    },
    dependencies: {
      "@modelcontextprotocol/sdk": "^1.32.2",
      zod: "^4.6.6",
    },
    devDependencies: {
      "@types/node": "^22.0.0",
      tsx: "^4.19.0",
      typescript: "^5.7.0",
    },
  };
  return JSON.stringify(pkg, null, 2) + "\n";
}
