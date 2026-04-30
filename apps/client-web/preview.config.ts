import { definePreviewConfig } from "@qaveai/foldkit-preview/config";

export default definePreviewConfig({
  title: "QaveAI UI Preview",
  previews: "src/**/*.preview.ts",
  css: "src/style.css",
});
