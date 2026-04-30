export type PreviewConfig = Readonly<{
  title?: string;
  previews?: string | ReadonlyArray<string>;
  css?: string | ReadonlyArray<string>;
}>;

export const definePreviewConfig = (config: PreviewConfig): PreviewConfig => config;
