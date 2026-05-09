import { foldkit } from "@foldkit/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import type { PreviewConfig } from "../src/config";

const virtualModuleId = "virtual:foldkit-preview";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

const asArray = (
  value: string | ReadonlyArray<string> | undefined,
  fallback: ReadonlyArray<string>,
): ReadonlyArray<string> => (value === undefined ? fallback : typeof value === "string" ? [value] : value);

const escapeString = (value: string): string => JSON.stringify(value);

const toConsumerPath = (root: string, path: string): string => (path.startsWith("/") ? path : resolve(root, path));

const toFsImportPath = (path: string): string => `/@fs${path}`;

const walkFiles = (directory: string): ReadonlyArray<string> => {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    const stat = statSync(path);
    return stat.isDirectory() ? walkFiles(path) : [path];
  });
};

const previewFilesForPattern = (root: string, pattern: string): ReadonlyArray<string> => {
  const normalized = pattern.replaceAll("\\", "/");
  const recursiveSuffix = "/**/*.preview.ts";

  if (normalized.endsWith(recursiveSuffix)) {
    return walkFiles(resolve(root, normalized.slice(0, -recursiveSuffix.length))).filter((path) =>
      path.endsWith(".preview.ts"),
    );
  }

  const path = toConsumerPath(root, pattern);
  return existsSync(path) ? [path] : [];
};

const previewFilesForPatterns = (root: string, patterns: ReadonlyArray<string>): ReadonlyArray<string> =>
  [...new Set(patterns.flatMap((pattern) => previewFilesForPattern(root, pattern)))].sort((a, b) => a.localeCompare(b));

const previewPlugin = (config: PreviewConfig, root: string): Plugin => ({
  name: "foldkit-preview",
  resolveId(id) {
    return id === virtualModuleId ? resolvedVirtualModuleId : undefined;
  },
  load(id) {
    if (id !== resolvedVirtualModuleId) {
      return undefined;
    }

    const previews = asArray(config.previews, ["src/**/*.preview.ts"]);
    const css = asArray(config.css, []);
    const cssImports = css
      .map((path) => `import ${escapeString(toFsImportPath(toConsumerPath(root, path)))};`)
      .join("\n");
    const previewFiles = previewFilesForPatterns(root, previews);
    const previewImports = previewFiles
      .map((path, index) => `import * as preview${index} from ${escapeString(toFsImportPath(path))};`)
      .join("\n");
    const previewEntries = previewFiles.map((path, index) => `${escapeString(path)}: preview${index}`).join(",\n");

    return `${cssImports}
${previewImports}
export const config = ${JSON.stringify(config)};
export const modules = {
${previewEntries}
};`;
  },
});

const previewRoot = process.env.FOLDKIT_PREVIEW_ROOT ?? process.cwd();
const previewConfigPath = process.env.FOLDKIT_PREVIEW_CONFIG;
const previewConfigModule = previewConfigPath ? await import(pathToFileURL(previewConfigPath).href) : undefined;
const previewConfig = (previewConfigModule?.default ?? {}) as PreviewConfig;

export default defineConfig({
  root: new URL(".", import.meta.url).pathname,
  plugins: [previewPlugin(previewConfig, previewRoot), tailwindcss(), foldkit({ devToolsMcpPort: 9987 })],
  server: {
    port: 6006,
    fs: {
      allow: [previewRoot, new URL("..", import.meta.url).pathname],
    },
  },
  optimizeDeps: {
    entries: ["preview/src/main.ts"],
  },
});
