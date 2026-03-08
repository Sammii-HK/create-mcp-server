export function tsconfig(): string {
  const config = {
    compilerOptions: {
      target: "ES2022",
      module: "ES2022",
      moduleResolution: "bundler",
      outDir: "dist",
      rootDir: "src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true,
    },
    include: ["src"],
  };
  return JSON.stringify(config, null, 2) + "\n";
}
