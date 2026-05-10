import { Effect, Schema } from "effect";
import { Command } from "foldkit";
import { codeToTokens } from "shiki";
import { richTextCodeDarkTheme, richTextCodeLightTheme, type RichTextCodeTheme } from "./rich-text-editor.code-theme";
import { HighlightedRichTextCodeBlocks } from "./rich-text-editor.schema";
import type { RichTextCodeBlockLanguage } from "./nodes/code-block.node";
import type { RichTextCodeBlockHighlight, RichTextCodeHighlightToken } from "./rich-text-editor.schema";

export const RichTextCodeBlockHighlightRequest = Schema.Struct({
  blockIndex: Schema.Number,
  text: Schema.String,
  language: Schema.Union([Schema.Literal("bash"), Schema.Literal("python"), Schema.Literal("typescript")]),
});
export type RichTextCodeBlockHighlightRequest = typeof RichTextCodeBlockHighlightRequest.Type;

const shikiLanguage = (language: RichTextCodeBlockLanguage): "bash" | "python" | "typescript" => language;

const highlightedLinesForTheme = async (request: RichTextCodeBlockHighlightRequest, theme: RichTextCodeTheme) => {
  const result = await codeToTokens(request.text, {
    lang: shikiLanguage(request.language),
    theme,
  });

  return result.tokens;
};

const mergeThemeTokens = (
  lightLines: Awaited<ReturnType<typeof highlightedLinesForTheme>>,
  darkLines: Awaited<ReturnType<typeof highlightedLinesForTheme>>,
): ReadonlyArray<ReadonlyArray<RichTextCodeHighlightToken>> =>
  lightLines.map((line, lineIndex) => {
    const darkLine = darkLines[lineIndex] ?? [];
    return line.map((token, tokenIndex) => {
      const darkToken = darkLine[tokenIndex];
      return {
        content: token.content,
        ...(token.color ? { lightColor: token.color } : {}),
        ...(darkToken?.color ? { darkColor: darkToken.color } : {}),
      };
    });
  });

export const highlightRichTextCodeBlock = async (
  request: RichTextCodeBlockHighlightRequest,
): Promise<RichTextCodeBlockHighlight> => {
  const [lightLines, darkLines] = await Promise.all([
    highlightedLinesForTheme(request, richTextCodeLightTheme),
    highlightedLinesForTheme(request, richTextCodeDarkTheme),
  ]);

  return {
    blockIndex: request.blockIndex,
    text: request.text,
    language: request.language,
    lines: mergeThemeTokens(lightLines, darkLines),
  };
};

const HighlightRichTextCodeBlocksCommand = Command.define("HighlightRichTextCodeBlocks", HighlightedRichTextCodeBlocks);

export const HighlightRichTextCodeBlocks = (requests: ReadonlyArray<RichTextCodeBlockHighlightRequest>) =>
  HighlightRichTextCodeBlocksCommand(
    Effect.promise(async () =>
      HighlightedRichTextCodeBlocks({ highlights: await Promise.all(requests.map(highlightRichTextCodeBlock)) }),
    ),
  );
