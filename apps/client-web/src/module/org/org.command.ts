import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { Command } from "foldkit";
import { orgRpc } from "../../rpc";
import { OrgCreated, OrgFailed, OrgLoaded } from "./org.message";

const OrgCommandLoad = Command.define("OrgCommandLoad", OrgLoaded, OrgFailed);
const OrgCommandCreate = Command.define("OrgCommandCreate", OrgCreated, OrgFailed);

export const loadOrgs = OrgCommandLoad(
  orgRpc.list.pipe(
    Effect.map((orgs) => OrgLoaded({ orgs })),
    Effect.catchCause((cause) => Effect.succeed(OrgFailed({ message: Cause.pretty(cause) }))),
  ),
);

export const createOrg = (name: string) =>
  OrgCommandCreate(
    orgRpc.create(name).pipe(
      Effect.map((org) => OrgCreated({ org })),
      Effect.catchCause((cause) => Effect.succeed(OrgFailed({ message: Cause.pretty(cause) }))),
    ),
  );
