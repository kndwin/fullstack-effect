import { describe, expect, test } from "bun:test";
import { googleProvider } from "./provider";

describe("google provider", () => {
  test("builds an authorization URL for the configured client", () => {
    const url = new URL(googleProvider.authorizationUrl("state-123"));
    expect(url.origin).toBe("http://localhost:4000");
    expect(url.pathname).toBe("/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("qaveai-client.apps.googleusercontent.com");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://backend.fullstack-effect.localhost/auth/google/callback",
    );
    expect(url.searchParams.get("state")).toBe("state-123");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
  });
});
