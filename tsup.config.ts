import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", scaffold: "src/scaffold.ts" },
  format: ["esm"],
  target: "node18",
  banner: { js: "#!/usr/bin/env node" },
  clean: false,
  minify: false,
  splitting: false,
});
