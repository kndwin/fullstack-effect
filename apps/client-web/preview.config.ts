import { definePreviewConfig } from "@qaveai/foldkit-preview/config";

export default definePreviewConfig({
  title: "Main App",
  previews: "src/**/*.preview.ts",
  css: "src/style.css",
  devToolsMcpPort: 9986,
});
