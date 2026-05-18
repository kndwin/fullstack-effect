import { describe, expect, test } from "bun:test";
import { createLocalStorageCursorStore } from "./local-storage.cursor.store";

describe("local storage cursor store", () => {
  test("persists cursors separately per tenant", async () => {
    const store = createLocalStorageCursorStore({ storage: createMemoryStorage() });

    await store.setCursor({ tenantId: "tenant_1", lastSeq: 3 });

    expect(await store.getCursor("tenant_1")).toEqual({ tenantId: "tenant_1", lastSeq: 3 });
    expect(await store.getCursor("tenant_2")).toBeNull();
  });
});

const createMemoryStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } satisfies Pick<Storage, "getItem" | "setItem" | "removeItem">;
};
