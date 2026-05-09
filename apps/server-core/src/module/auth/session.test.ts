import { describe, expect, test } from "bun:test";
import { createSignedValue, verifySignedValue } from "./session";

describe("session signing", () => {
  test("verifies signed values", async () => {
    const signed = await createSignedValue("state-123");
    expect(await verifySignedValue(signed)).toBe("state-123");
  });

  test("rejects tampered values", async () => {
    const signed = await createSignedValue("state-123");
    expect(await verifySignedValue(signed.replace("state-123", "state-456"))).toBeNull();
  });
});
