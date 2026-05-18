import { Diagnostic, Plugin, Rule, RuleContext, type ESTree } from "effect-oxlint";
import { Effect } from "effect";

const effectSuggestion = { type: "suggestion" as const };

const isIdentifierAliasExport = (node: ESTree.Node): node is ESTree.ExportNamedDeclaration => {
  if (node.type !== "ExportNamedDeclaration") return false;
  const declaration = node.declaration;
  if (declaration?.type !== "VariableDeclaration" || declaration.kind !== "const") return false;

  return declaration.declarations.some(
    (declarator) => declarator.id.type === "Identifier" && declarator.init?.type === "Identifier",
  );
};

const noExportConstIdentifierAlias = Rule.define({
  name: "no-export-const-identifier-alias",
  meta: Rule.meta({
    type: "suggestion",
    description: "Avoid exported const aliases that hide the original symbol name.",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    if (/\.schema\.tsx?$/.test(ctx.filename)) return {};

    return {
      ExportNamedDeclaration: (node: ESTree.Node) => {
        if (!isIdentifierAliasExport(node)) return Effect.void;
        return ctx.report(
          Diagnostic.make({
            node,
            message: "Do not export const aliases to another identifier; export/import the original symbol instead.",
          }),
        );
      },
    };
  },
});

const serverModuleInterfaceImplementFiles = Rule.define({
  name: "server-module-interface-implement-files",
  meta: Rule.meta({
    type: "suggestion",
    description: "Split server-core repo/service modules into *.interface.ts and *.implement.ts files.",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    if (!/apps\/server-core\/src\/module\/.+\/.+\.(repo|service)\.ts$/.test(ctx.filename)) return {};

    return {
      Program: (node: ESTree.Node) =>
        ctx.report(
          Diagnostic.make({
            node,
            message:
              "Use *.repo.interface.ts + *.repo.implement.ts or *.service.interface.ts + *.service.implement.ts.",
          }),
        ),
    };
  },
});

const isContextServiceClass = (node: ESTree.Node): boolean => {
  if (node.type === "ExportNamedDeclaration" && node.declaration) return isContextServiceClass(node.declaration);
  if (node.type !== "ClassDeclaration") return false;
  const superClass = node.superClass;
  if (!superClass || superClass.type !== "CallExpression") return false;
  const callee = superClass.callee;
  if (callee.type !== "CallExpression") return false;
  const innerCallee = callee.callee.type === "TSInstantiationExpression" ? callee.callee.expression : callee.callee;
  return (
    innerCallee.type === "MemberExpression" &&
    innerCallee.object.type === "Identifier" &&
    innerCallee.object.name === "Context" &&
    innerCallee.property.type === "Identifier" &&
    innerCallee.property.name === "Service"
  );
};

const interfaceFilesUseContextService = Rule.define({
  name: "interface-files-use-context-service",
  meta: Rule.meta({
    type: "suggestion",
    description: "Capability *.interface.ts files should export Context.Service tags.",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const isCapabilityInterface =
      /apps\/server-core\/src\/module\/.+\/.+\.(repo|service)\.interface\.ts$/.test(ctx.filename) ||
      /packages\/sync\/src\/server\/.+\.interface\.ts$/.test(ctx.filename);
    if (!isCapabilityInterface) return {};

    return {
      Program: (node: ESTree.Node) => {
        if (node.type !== "Program") return Effect.void;
        if (node.body.some(isContextServiceClass)) return Effect.void;

        return ctx.report(
          Diagnostic.make({
            node,
            message:
              "Capability interface files should export a Context.Service tag; put live layers in *.implement*.ts files.",
          }),
        );
      },
    };
  },
});

const rawSpacingClassPattern =
  /(?:^|\s)(?:-?(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y)-\d+(?:\.5)?)(?:\s|$)/;

const noRawSpacingUtilities = Rule.define({
  name: "no-raw-spacing-utilities",
  meta: Rule.meta({
    type: "suggestion",
    description: "Use client-ds spacing tokens instead of raw Tailwind spacing utilities in app views.",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    if (!/apps\/client-web\/src\/.+\.(view|preview)\.ts$/.test(ctx.filename)) return {};

    return {
      Literal: (node: ESTree.Node) => {
        if (node.type !== "Literal" || typeof node.value !== "string") return Effect.void;
        if (!rawSpacingClassPattern.test(node.value)) return Effect.void;

        return ctx.report(
          Diagnostic.make({
            node,
            message:
              "Use client-ds spacing tokens such as gap-[var(--space-3)] or component spacing props instead of raw spacing utilities.",
          }),
        );
      },
    };
  },
});

export default Plugin.define({
  name: "effect-local",
  rules: {
    "no-throw": Rule.banStatement("ThrowStatement", {
      message: "Use Effect.fail or a Schema.TaggedErrorClass instead of throw.",
      meta: effectSuggestion,
    }),
    "no-json-parse": Rule.banCallOfMember("JSON", ["parse", "stringify"], {
      message: "Use Effect Schema decoding/encoding instead of JSON.parse/stringify.",
      meta: effectSuggestion,
    }),
    "no-math-random": Rule.banCallOfMember("Math", "random", {
      message: "Use Effect Random or crypto.randomUUID where IDs are required.",
      meta: effectSuggestion,
    }),
    "no-new-date": Rule.banNewExpr("Date", {
      message: "Use Effect Clock/DateTime for time-dependent code.",
      meta: effectSuggestion,
    }),
    "no-effect-run-in-module": Rule.banCallOfMember("Effect", ["runSync", "runPromise"], {
      message: "Keep Effects composable; run them only at process or HTTP entry points.",
      meta: effectSuggestion,
    }),
    "no-export-const-identifier-alias": noExportConstIdentifierAlias,
    "server-module-interface-implement-files": serverModuleInterfaceImplementFiles,
    "interface-files-use-context-service": interfaceFilesUseContextService,
    "no-raw-spacing-utilities": noRawSpacingUtilities,
    "no-shared-barrel-import": Rule.banImport("@qaveai/shared", {
      message: "Import direct shared module paths instead of the @qaveai/shared barrel.",
      meta: effectSuggestion,
    }),
  },
});
