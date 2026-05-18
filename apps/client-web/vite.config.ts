import { foldkit } from "@foldkit/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const backendOrigin = process.env.BACKEND_ORIGIN ?? "https://backend.fullstack-effect.localhost";
const port = process.env.PORT === undefined ? undefined : Number(process.env.PORT);

export default defineConfig({
  plugins: [tailwindcss(), foldkit({ devToolsMcpPort: 9988 })],
  server: {
    host: process.env.HOST ?? "0.0.0.0",
    port,
    strictPort: port !== undefined,
    proxy: {
      "/rpc": { target: backendOrigin, changeOrigin: true, secure: false },
      "/auth": { target: backendOrigin, changeOrigin: true, secure: false },
    },
  },
  optimizeDeps: {
    entries: ["src/main.ts"],
  },
});
