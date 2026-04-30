declare module "virtual:foldkit-preview" {
  import type { PreviewConfig } from "../../src/config";
  import type { PreviewModule } from "../../src/index";

  export const config: PreviewConfig;
  export const modules: Record<string, PreviewModule>;
}
