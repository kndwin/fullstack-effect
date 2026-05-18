import { ErrorAuthProviderFailed } from "@qaveai/shared/module/auth/auth.schema";

export type OAuthProfile = {
  email: string;
  name: string;
  avatarUrl: string | null;
};

export type OAuthProvider = {
  id: "google";
  authorizationUrl: (state: string) => string;
  exchangeCode: (code: string) => Promise<string>;
  getProfile: (accessToken: string) => Promise<OAuthProfile>;
};

const issuer = () => process.env.GOOGLE_ISSUER_URL ?? "http://localhost:4000";
const clientId = () => process.env.GOOGLE_CLIENT_ID ?? "qaveai-client.apps.googleusercontent.com";
const clientSecret = () => process.env.GOOGLE_CLIENT_SECRET ?? "GOCSPX-qaveai-secret";
const authBaseUrl = () => process.env.AUTH_BASE_URL ?? "https://backend.fullstack-effect.localhost";

export const appUrl = () => process.env.AUTH_APP_URL ?? "https://fullstack-effect.localhost";

export const googleProvider: OAuthProvider = {
  id: "google",
  authorizationUrl: (state) => {
    const url = new URL(`${issuer()}/o/oauth2/v2/auth`);
    url.searchParams.set("client_id", clientId());
    url.searchParams.set("redirect_uri", `${authBaseUrl()}/auth/google/callback`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    return url.toString();
  },
  exchangeCode: async (code) => {
    const response = await fetch(`${issuer()}/oauth2/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId(),
        client_secret: clientSecret(),
        code,
        grant_type: "authorization_code",
        redirect_uri: `${authBaseUrl()}/auth/google/callback`,
      }),
    });
    if (!response.ok)
      throw new ErrorAuthProviderFailed({ message: `Google token exchange failed: ${response.status}` });
    const body = (await response.json()) as { access_token?: string };
    if (!body.access_token)
      throw new ErrorAuthProviderFailed({ message: "Google token response did not include an access token" });
    return body.access_token;
  },
  getProfile: async (accessToken) => {
    const response = await fetch(`${issuer()}/oauth2/v2/userinfo`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new ErrorAuthProviderFailed({ message: `Google userinfo failed: ${response.status}` });
    const body = (await response.json()) as { email?: string; name?: string; picture?: string };
    if (!body.email) throw new ErrorAuthProviderFailed({ message: "Google userinfo did not include an email" });
    return { email: body.email, name: body.name ?? body.email, avatarUrl: body.picture ?? null };
  },
};

export const providers = { google: googleProvider } as const;
