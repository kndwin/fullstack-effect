#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "vite";

const args = process.argv.slice(2);
const command = args[0] ?? "dev";

const readArg = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};

if (command !== "dev") {
  throw new Error(`Unsupported command "${command}". Use "foldkit-preview dev".`);
}

const cwd = process.cwd();
const configPath = resolve(cwd, readArg("--config") ?? "preview.config.ts");

if (!existsSync(configPath)) {
  throw new Error(`Could not find preview config at ${configPath}`);
}

process.env.FOLDKIT_PREVIEW_ROOT = cwd;
process.env.FOLDKIT_PREVIEW_CONFIG = configPath;

const port = Number(readArg("--port") ?? "6006");
const packageRoot = new URL("..", import.meta.url);
const viteConfig = new URL("preview/vite.config.ts", packageRoot);

const server = await createServer({
  configFile: pathToFileURL(viteConfig.pathname).pathname,
  server: {
    host: "0.0.0.0",
    port,
  },
});

await server.listen();
server.printUrls();
