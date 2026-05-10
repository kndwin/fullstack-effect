import {
  amberDark,
  blue,
  blueDark,
  cyan,
  cyanDark,
  green,
  greenDark,
  mauveDark,
  orange,
  purple,
  purpleDark,
  red,
  redDark,
  slate,
} from "@radix-ui/colors";

type TextMateThemeSetting = {
  scope?: string | Array<string>;
  settings: {
    foreground?: string;
    background?: string;
    fontStyle?: string;
  };
};

export type RichTextCodeTheme = {
  name: string;
  type: "light" | "dark";
  fg: string;
  bg: string;
  colors: { "editor.foreground": string; "editor.background": string };
  settings: Array<TextMateThemeSetting>;
};

const codeThemeSettings = (palette: {
  foreground: string;
  muted: string;
  keyword: string;
  string: string;
  number: string;
  functionName: string;
  typeName: string;
  operator: string;
  invalid: string;
}): Array<TextMateThemeSetting> => [
  { settings: { foreground: palette.foreground } },
  {
    scope: ["comment", "punctuation.definition.comment"],
    settings: { foreground: palette.muted, fontStyle: "italic" },
  },
  {
    scope: ["keyword", "storage", "storage.type", "storage.modifier", "support.type.primitive"],
    settings: { foreground: palette.keyword },
  },
  {
    scope: ["string", "punctuation.definition.string", "constant.character", "constant.other.symbol"],
    settings: { foreground: palette.string },
  },
  {
    scope: ["constant.numeric", "constant.language", "constant.other", "variable.language"],
    settings: { foreground: palette.number },
  },
  {
    scope: ["entity.name.function", "support.function", "meta.function-call", "variable.function"],
    settings: { foreground: palette.functionName },
  },
  {
    scope: ["entity.name.type", "entity.name.class", "support.class", "support.type", "meta.type.annotation"],
    settings: { foreground: palette.typeName },
  },
  {
    scope: ["keyword.operator", "punctuation", "meta.brace", "meta.delimiter"],
    settings: { foreground: palette.operator },
  },
  {
    scope: ["entity.name.tag", "support.type.property-name", "variable.other.property"],
    settings: { foreground: palette.keyword },
  },
  {
    scope: ["invalid", "invalid.illegal"],
    settings: { foreground: palette.invalid },
  },
];

export const richTextCodeLightTheme: RichTextCodeTheme = {
  name: "qave-radix-light-code",
  type: "light",
  fg: slate.slate12,
  bg: slate.slate2,
  colors: {
    "editor.foreground": slate.slate12,
    "editor.background": slate.slate2,
  },
  settings: codeThemeSettings({
    foreground: slate.slate12,
    muted: slate.slate11,
    keyword: blue.blue11,
    string: green.green11,
    number: purple.purple11,
    functionName: cyan.cyan11,
    typeName: orange.orange11,
    operator: slate.slate10,
    invalid: red.red11,
  }),
};

export const richTextCodeDarkTheme: RichTextCodeTheme = {
  name: "qave-radix-dark-code",
  type: "dark",
  fg: mauveDark.mauve12,
  bg: mauveDark.mauve2,
  colors: {
    "editor.foreground": mauveDark.mauve12,
    "editor.background": mauveDark.mauve2,
  },
  settings: codeThemeSettings({
    foreground: mauveDark.mauve12,
    muted: mauveDark.mauve11,
    keyword: blueDark.blue11,
    string: greenDark.green11,
    number: purpleDark.purple11,
    functionName: cyanDark.cyan11,
    typeName: amberDark.amber11,
    operator: mauveDark.mauve10,
    invalid: redDark.red11,
  }),
};
