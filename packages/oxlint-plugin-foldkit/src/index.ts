import * as Effect from "effect/Effect";
import { Diagnostic, Plugin, Rule, RuleContext, type ESTree } from "effect-oxlint";
import { existsSync } from "node:fs";

const isIdentifier = (node: unknown, name?: string): node is { readonly type: "Identifier"; readonly name: string } =>
  typeof node === "object" &&
  node !== null &&
  "type" in node &&
  node.type === "Identifier" &&
  "name" in node &&
  typeof node.name === "string" &&
  (name === undefined || node.name === name);

const isStringLiteral = (node: unknown): node is ESTree.StringLiteral =>
  typeof node === "object" &&
  node !== null &&
  "type" in node &&
  node.type === "Literal" &&
  "value" in node &&
  typeof node.value === "string";

const isCallExpression = (node: ESTree.Node): node is ESTree.CallExpression => node.type === "CallExpression";

const isMemberExpression = (node: ESTree.Node): node is ESTree.MemberExpression => node.type === "MemberExpression";

const isProgram = (node: ESTree.Node): node is ESTree.Program => node.type === "Program";

const isMCall = (node: ESTree.CallExpression): boolean => isIdentifier(node.callee, "m");

const firstStringArgument = (node: ESTree.CallExpression): ESTree.StringLiteral | undefined => {
  const [first] = node.arguments;
  return isStringLiteral(first) ? first : undefined;
};

const isMessageSchemaExpression = (node: unknown): boolean => {
  if (isIdentifier(node)) return node.name.endsWith("Message");
  if (typeof node !== "object" || node === null || !("type" in node) || node.type !== "MemberExpression") return false;
  if (!("computed" in node) || !("property" in node)) return false;

  return !node.computed && isIdentifier(node.property, "Message");
};

const hasSubmodelMessagePayloadProperty = (node: ESTree.CallExpression): boolean => {
  const [, second] = node.arguments;
  if (typeof second !== "object" || second === null || !("type" in second) || second.type !== "ObjectExpression") {
    return false;
  }

  return second.properties.some((property) => {
    if (property.type !== "Property") return false;
    const hasMessageKey =
      isIdentifier(property.key, "message") || (isStringLiteral(property.key) && property.key.value === "message");
    return hasMessageKey && isMessageSchemaExpression(property.value);
  });
};

const isBareCall = (node: ESTree.CallExpression, names: ReadonlyArray<string>): boolean =>
  isIdentifier(node.callee) && names.includes(node.callee.name);

const isStaticMember = (
  node: ESTree.MemberExpression,
  objectName: string,
  propertyNames: ReadonlyArray<string>,
): boolean =>
  !node.computed &&
  isIdentifier(node.object, objectName) &&
  isIdentifier(node.property) &&
  propertyNames.includes(node.property.name);

const isMemberCall = (node: ESTree.CallExpression, objectName: string, propertyNames: ReadonlyArray<string>): boolean =>
  node.callee.type === "MemberExpression" && isStaticMember(node.callee, objectName, propertyNames);

const isUpdateOrViewFile = (filename: string): boolean => /\.(update|view)\.tsx?$/.test(filename);

const isImplementationFile = (filename: string): boolean =>
  /\.tsx?$/.test(filename) && !/\.(test|preview|schema)\.tsx?$/.test(filename) && !filename.endsWith(".d.ts");

const isObjectParam = (param: ESTree.Node | undefined): boolean => param?.type === "ObjectPattern";

const hasObjectParams = (node: { readonly params: ReadonlyArray<ESTree.Node> }): boolean =>
  node.params.length === 0 || (node.params.length === 1 && isObjectParam(node.params[0]));

const noNoopMessage = Rule.define({
  name: "no-noop-message",
  meta: Rule.meta({
    type: "suggestion",
    description: "Use meaningful Foldkit messages instead of generic NoOp messages.",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    return {
      CallExpression: (node: ESTree.Node) => {
        if (!isCallExpression(node)) return Effect.void;
        if (!isMCall(node)) return Effect.void;
        const messageName = firstStringArgument(node);
        if (messageName === undefined || !["NoOp", "Noop", "NoOperation"].includes(messageName.value)) {
          return Effect.void;
        }

        return ctx.report(
          Diagnostic.make({
            node: messageName,
            message: "Every Foldkit message should describe what happened; avoid generic NoOp messages.",
          }),
        );
      },
    };
  },
});

const gotSubmodelMessageName = Rule.define({
  name: "got-submodel-message-name",
  meta: Rule.meta({
    type: "suggestion",
    description: "Name Foldkit submodel wrapper messages with the Got*Message convention.",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    return {
      CallExpression: (node: ESTree.Node) => {
        if (!isCallExpression(node)) return Effect.void;
        if (!isMCall(node) || !hasSubmodelMessagePayloadProperty(node)) return Effect.void;
        const messageName = firstStringArgument(node);
        if (messageName === undefined || /^Got[A-Z].*Message$/.test(messageName.value)) return Effect.void;

        return ctx.report(
          Diagnostic.make({
            node: messageName,
            message: "Submodel wrapper messages should be named Got*Message so Foldkit DevTools can filter them.",
          }),
        );
      },
    };
  },
});

const noSideEffectsInUpdateView = Rule.define({
  name: "no-side-effects-in-update-view",
  meta: Rule.meta({
    type: "suggestion",
    description:
      "Keep Foldkit update and view functions pure; put side effects in Commands, Mounts, flags, Subscriptions, or Resources.",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    if (!isUpdateOrViewFile(ctx.filename)) return {};

    return {
      CallExpression: (node: ESTree.Node) => {
        if (!isCallExpression(node)) return Effect.void;
        const banned =
          isBareCall(node, ["fetch", "setTimeout", "setInterval"]) ||
          isMemberCall(node, "Date", ["now"]) ||
          isMemberCall(node, "Math", ["random"]) ||
          isMemberCall(node, "console", ["debug", "error", "info", "log", "table", "trace", "warn"]);
        if (!banned) return Effect.void;

        return ctx.report(
          Diagnostic.make({
            node,
            message:
              "Foldkit update/view code should be pure; move side effects into a Command, Mount, flags, Subscription, or Resource.",
          }),
        );
      },
      MemberExpression: (node: ESTree.Node) => {
        if (!isMemberExpression(node)) return Effect.void;
        if (
          !isStaticMember(node, "document", [
            "body",
            "cookie",
            "documentElement",
            "getElementById",
            "querySelector",
            "querySelectorAll",
          ]) &&
          !isStaticMember(node, "window", [
            "addEventListener",
            "innerHeight",
            "innerWidth",
            "localStorage",
            "location",
            "removeEventListener",
            "sessionStorage",
          ])
        ) {
          return Effect.void;
        }

        return ctx.report(
          Diagnostic.make({
            node,
            message:
              "Foldkit update/view code should not access browser globals directly; use Commands, Mounts, flags, Subscriptions, or Resources.",
          }),
        );
      },
    };
  },
});

const objectParamsOnly = Rule.define({
  name: "object-params-only",
  meta: Rule.meta({
    type: "suggestion",
    description: "Prefer single object parameters over positional function parameters.",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    if (!isImplementationFile(ctx.filename)) return {};
    const reportObjectParams = (node: ESTree.Node & { readonly params: ReadonlyArray<ESTree.Node> }) =>
      hasObjectParams(node)
        ? Effect.void
        : ctx.report(
            Diagnostic.make({
              node,
              message: "Functions should accept a single object parameter instead of positional parameters.",
            }),
          );

    return {
      FunctionDeclaration: (node: ESTree.Node) => {
        if (node.type !== "FunctionDeclaration") return Effect.void;
        return reportObjectParams(node);
      },
      VariableDeclarator: (node: ESTree.Node) => {
        if (node.type !== "VariableDeclarator") return Effect.void;
        const init = node.init;
        if (init?.type !== "ArrowFunctionExpression" && init?.type !== "FunctionExpression") return Effect.void;
        return reportObjectParams(init);
      },
      Property: (node: ESTree.Node) => {
        if (node.type !== "Property") return Effect.void;
        const value = node.value;
        if (value.type !== "ArrowFunctionExpression" && value.type !== "FunctionExpression") return Effect.void;
        return reportObjectParams(value);
      },
    };
  },
});

const utilFilesHaveTests = Rule.define({
  name: "util-files-have-tests",
  meta: Rule.meta({
    type: "suggestion",
    description: "Require every *.util.ts file to have a matching *.util.test.ts file.",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    if (!ctx.filename.endsWith(".util.ts") || ctx.filename.endsWith(".util.test.ts")) return {};

    return {
      Program: (node: ESTree.Node) => {
        if (!isProgram(node)) return Effect.void;
        const testFilename = ctx.filename.replace(/\.util\.ts$/, ".util.test.ts");
        if (existsSync(testFilename)) return Effect.void;

        return ctx.report(
          Diagnostic.make({
            node,
            message: "Every *.util.ts file should have a matching *.util.test.ts file.",
          }),
        );
      },
    };
  },
});

export default Plugin.define({
  name: "foldkit",
  rules: {
    "got-submodel-message-name": gotSubmodelMessageName,
    "no-noop-message": noNoopMessage,
    "no-side-effects-in-update-view": noSideEffectsInUpdateView,
    "object-params-only": objectParamsOnly,
    "util-files-have-tests": utilFilesHaveTests,
  },
});
