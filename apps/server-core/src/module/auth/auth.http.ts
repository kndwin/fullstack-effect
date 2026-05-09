import { ErrorAuthInvalidOAuthState, ErrorAuthProviderFailed } from "@qaveai/shared/module/auth/auth.schema";
import { Effect } from "effect";
import { OrgService, OrgServiceLive } from "../org/org.service";
import { appUrl, providers } from "./provider";
import {
  clearCookie,
  cookie,
  createSession,
  createSignedValue,
  destroySession,
  getSession,
  parseCookies,
  sessionCookieName,
  stateCookieName,
  upsertUser,
  verifySignedValue,
} from "./session";

const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value), { ...init, headers: { "content-type": "application/json", ...init?.headers } });

export const handleAuthRequest = async (request: Request) => {
  const url = new URL(request.url);

  if (url.pathname === "/auth/me") return json(await getSession(request));

  if (url.pathname === "/auth/logout") {
    await destroySession(request);
    return json(null, { headers: { "set-cookie": clearCookie(sessionCookieName) } });
  }

  if (url.pathname === "/auth/google/start") {
    const state = crypto.randomUUID();
    return new Response(null, {
      status: 302,
      headers: {
        location: providers.google.authorizationUrl(state),
        "set-cookie": cookie(stateCookieName, await createSignedValue(state), 600),
      },
    });
  }

  if (url.pathname === "/auth/google/callback") {
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");
    const expectedState = await verifySignedValue(parseCookies(request)[stateCookieName]);
    if (!state || !code || state !== expectedState) return json(new ErrorAuthInvalidOAuthState(), { status: 400 });

    let accessToken: string;
    let profile;
    try {
      accessToken = await providers.google.exchangeCode(code);
      profile = await providers.google.getProfile(accessToken);
    } catch (error) {
      if (error instanceof ErrorAuthProviderFailed) return json(error, { status: 502 });
      throw error;
    }
    const user = upsertUser(profile);
    await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* OrgService;
        yield* service.ensureDefaultForUser(user);
      }).pipe(Effect.provide(OrgServiceLive)),
    );
    const signedSession = await createSession(user);

    return new Response(null, {
      status: 302,
      headers: [
        ["location", appUrl()],
        ["set-cookie", cookie(sessionCookieName, signedSession, 60 * 60 * 24 * 30)],
        ["set-cookie", clearCookie(stateCookieName)],
      ],
    });
  }

  return null;
};
