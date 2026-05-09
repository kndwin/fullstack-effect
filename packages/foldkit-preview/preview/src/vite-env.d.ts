declare module "virtual:foldkit-preview" {
  import type { PreviewConfig } from "../../src/config";

  export const config: PreviewConfig;
  export const modules: Record<string, unknown>;
}
