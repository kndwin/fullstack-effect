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
    "no-shared-barrel-import": Rule.banImport("@qaveai/shared", {
      message: "Import direct shared module paths instead of the @qaveai/shared barrel.",
      meta: effectSuggestion,
    }),
  },
});
