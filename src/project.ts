import { isAbsolute, relative, resolve, sep } from "node:path";

export const EXAMPLE_TOOLS = [
  "hello",
  "calculator",
  "notes",
  "summarise",
] as const;

export function validateProjectName(name: string): true | string {
  if (!name || name.length > 214 || !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    return "Use 1–214 lowercase letters, numbers or hyphens, starting with a letter or number";
  }
  return true;
}

export function projectDirectory(cwd: string, name: string): string {
  const valid = validateProjectName(name);
  if (valid !== true) throw new Error(valid);
  const parent = resolve(cwd);
  const directory = resolve(parent, name);
  const child = relative(parent, directory);
  if (
    !child ||
    child === ".." ||
    child.startsWith(".." + sep) ||
    isAbsolute(child)
  ) {
    throw new Error(
      "The project must be a new directory inside the current folder",
    );
  }
  return directory;
}
