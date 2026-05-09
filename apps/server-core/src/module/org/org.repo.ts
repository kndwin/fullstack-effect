import { UserSchema } from "@qaveai/shared/module/auth/auth.schema";
import { ErrorOrgInvalidName } from "@qaveai/shared/module/org/org.schema";
import { Context, Effect, Layer } from "effect";
import { users } from "../auth/auth.table";
import { DB, PgLive } from "../../platform/db";
import { orgMemberships, orgs } from "./org.table";

type User = typeof UserSchema.Type;

const newOrgId = () => `org_${crypto.randomUUID()}`;

export class OrgRepository extends Context.Service<OrgRepository>()("OrgRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    const ensureUser = Effect.fn("OrgRepository.ensureUser")(function* (user: User) {
      yield* db
        .insert(users)
        .values(user)
        .onConflictDoUpdate({
          target: users.id,
          set: { email: user.email, name: user.name, avatarUrl: user.avatarUrl },
        });
    });

    const createForUser = Effect.fn("OrgRepository.createForUser")(function* (userId: string, name: string) {
      const trimmed = name.trim();
      if (!trimmed) return yield* new ErrorOrgInvalidName({ message: "Org name is required" });

      const [org] = yield* db.insert(orgs).values({ id: newOrgId(), name: trimmed }).returning();
      if (!org) return yield* Effect.die(new Error("Org insert returned no rows"));

      yield* db.insert(orgMemberships).values({ orgId: org.id, userId, role: "owner" });
      return org;
    });

    return {
      ensureDefaultForUser: Effect.fn("OrgRepository.ensureDefaultForUser")(function* (user: User) {
        yield* ensureUser(user);

        const membership = yield* db.query.orgMemberships.findFirst({ where: { userId: user.id } });
        if (membership) return;

        yield* createForUser(user.id, `${user.name}'s Org`);
      }),

      findManyForUser: Effect.fn("OrgRepository.findManyForUser")(function* (userId: string) {
        const memberships = yield* db.query.orgMemberships.findMany({ where: { userId } });
        if (memberships.length === 0) return [];

        const userOrgs = yield* Effect.all(
          memberships.map((membership) => db.query.orgs.findFirst({ where: { id: membership.orgId } })),
        );
        return userOrgs.filter((org): org is NonNullable<typeof org> => Boolean(org));
      }),

      userCanAccess: Effect.fn("OrgRepository.userCanAccess")(function* (userId: string, orgId: string) {
        const membership = yield* db.query.orgMemberships.findFirst({ where: { userId, orgId } });
        return Boolean(membership);
      }),

      createForUser,
    };
  }),
}) {}

export const OrgRepositoryLive = Layer.effect(OrgRepository)(OrgRepository.make).pipe(Layer.provide(PgLive));
