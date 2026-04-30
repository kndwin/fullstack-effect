import { loadPreviewModules, runPreviewApp } from "../../src/index";
import { config, modules } from "virtual:foldkit-preview";

runPreviewApp({
  title: config.title ?? "Foldkit Preview",
  modules: loadPreviewModules(modules),
});
