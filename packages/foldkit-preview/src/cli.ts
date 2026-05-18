#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "vite";

type Options = Readonly<{
  config: string;
  port: number;
}>;

const validatePort = (port: number): void => {
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid port: ${String(port)}`);
  }
};

const parsePort = (value: string): number => {
  const port = value.trim() === "" ? Number.NaN : Number(value);
  validatePort(port);
  return port;
};

const defaultPort = process.env.PORT === undefined ? 6006 : parsePort(process.env.PORT);

const parseArgs = (argv: ReadonlyArray<string>) => {
  const args = argv.slice(2);
  const command = args[0] === "dev" ? args.shift() : undefined;
  const options = { config: "preview.config.ts", port: defaultPort };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    if (arg === undefined) {
      continue;
    }

    if (arg === "--config") {
      options.config = args[++index] ?? options.config;
    } else if (arg.startsWith("--config=")) {
      options.config = arg.slice("--config=".length);
    } else if (arg === "--port") {
      options.port = parsePort(args[++index] ?? String(defaultPort));
    } else if (arg.startsWith("--port=")) {
      options.port = parsePort(arg.slice("--port=".length));
    } else if (arg === "--help" || arg === "-h") {
      console.log("Usage: foldkit-preview [dev] [--config preview.config.ts] [--port 6006]");
      process.exit(0);
    } else if (command === undefined) {
      throw new Error(`Unknown command: ${arg}`);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options satisfies Options;
};

const startPreview = async ({ config, port }: Options) => {
  const cwd = process.cwd();
  const configPath = resolve(cwd, config);

  process.env.FOLDKIT_PREVIEW_ROOT = cwd;

  if (existsSync(configPath)) {
    process.env.FOLDKIT_PREVIEW_CONFIG = configPath;
  } else {
    delete process.env.FOLDKIT_PREVIEW_CONFIG;
  }

  const packageRoot = new URL("..", import.meta.url);
  const viteConfig = new URL("preview/vite.config.ts", packageRoot);
  const server = await createServer({
    configFile: pathToFileURL(viteConfig.pathname).pathname,
    server: {
      host: "0.0.0.0",
      port,
      strictPort: false,
    },
  });

  await server.listen();
  server.printUrls();
};

try {
  await startPreview(parseArgs(process.argv));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
