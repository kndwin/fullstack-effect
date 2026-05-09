import { AuthSessionSchema, SessionUserSchema, UserSchema } from "@qaveai/shared/module/auth/auth.schema";

type User = typeof UserSchema.Type;
type AuthSession = typeof AuthSessionSchema.Type;

export const sessionCookieName = "qave_session";
export const stateCookieName = "qave_oauth_state";
const encoder = new TextEncoder();
const sessions = new Map<string, AuthSession>();
const usersByEmail = new Map<string, User>();

const secret = () => process.env.AUTH_SESSION_SECRET ?? "dev-auth-secret-change-me";

const base64url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

const sign = async (value: string) => {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
};

export const parseCookies = (request: Request) =>
  Object.fromEntries(
    (request.headers.get("cookie") ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...value] = part.split("=");
        return [key!, decodeURIComponent(value.join("="))] as const;
      }),
  );

export const createSignedValue = async (value: string) => `${value}.${await sign(value)}`;

export const verifySignedValue = async (signed: string | undefined) => {
  if (!signed) return null;
  const index = signed.lastIndexOf(".");
  if (index < 0) return null;
  const value = signed.slice(0, index);
  const signature = signed.slice(index + 1);
  return signature === (await sign(value)) ? value : null;
};

export const cookie = (name: string, value: string, maxAgeSeconds: number) =>
  `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;

export const clearCookie = (name: string) => `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export const upsertUser = (profile: { email: string; name: string; avatarUrl: string | null }) => {
  const existing = usersByEmail.get(profile.email);
  const user = UserSchema.make({
    id: existing?.id ?? `usr_${crypto.randomUUID()}`,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
  });
  usersByEmail.set(user.email, user);
  return user;
};

export const createSession = async (user: User) => {
  const id = `ses_${crypto.randomUUID()}`;
  const session = AuthSessionSchema.make({
    user: SessionUserSchema.make({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl }),
  });
  sessions.set(id, session);
  return createSignedValue(id);
};

export const getSession = async (request: Request) => {
  const id = await verifySignedValue(parseCookies(request)[sessionCookieName]);
  return id ? (sessions.get(id) ?? null) : null;
};

export const destroySession = async (request: Request) => {
  const id = await verifySignedValue(parseCookies(request)[sessionCookieName]);
  if (id) sessions.delete(id);
};
