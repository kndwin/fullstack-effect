import { definePreviewConfig } from "@qaveai/foldkit-preview/config";

export default definePreviewConfig({
  title: "Previews",
  previews: "src/**/*.preview.ts",
  css: "src/style.css",
});
